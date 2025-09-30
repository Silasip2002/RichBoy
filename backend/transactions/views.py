from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, F
from django.db.models.functions import Coalesce
from .models import Transaction, Account, Asset, BalanceSnapshot, ExchangeRate
from .serializers import TransactionSerializer, AccountSerializer, AssetSerializer, CategorySerializer, BalanceSnapshotSerializer
from richboy_backend.pagination import StandardResultsSetPagination
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction as db_transaction
import requests
import os
import logging
import yfinance as yf
from users.models import UserProfile
from decimal import Decimal

logger = logging.getLogger(__name__)

def convert_currency(amount, from_currency, to_currency):
    if from_currency == to_currency:
        return amount
    try:
        # Try direct conversion
        rate_obj = ExchangeRate.objects.get(base_currency=from_currency, target_currency=to_currency)
        return amount * rate_obj.rate
    except ExchangeRate.DoesNotExist:
        try:
            # Try inverse conversion
            rate_obj = ExchangeRate.objects.get(base_currency=to_currency, target_currency=from_currency)
            return amount / rate_obj.rate
        except ExchangeRate.DoesNotExist:
            # If not in DB, fetch from yfinance
            try:
                ticker_symbol = f"{from_currency}{to_currency}=X"
                ticker = yf.Ticker(ticker_symbol)
                hist = ticker.history(period="1d")
                if not hist.empty:
                    rate = Decimal(hist['Close'].iloc[-1])
                    # Save for next time
                    ExchangeRate.objects.create(base_currency=from_currency, target_currency=to_currency, rate=rate)
                    return amount * rate
                else:
                    # Try inverse ticker
                    ticker_symbol = f"{to_currency}{from_currency}=X"
                    ticker = yf.Ticker(ticker_symbol)
                    hist = ticker.history(period="1d")
                    if not hist.empty:
                        rate = Decimal(1) / Decimal(hist['Close'].iloc[-1])
                        ExchangeRate.objects.create(base_currency=from_currency, target_currency=to_currency, rate=rate)
                        return amount * rate
            except Exception as e:
                logger.error(f"yfinance fetch failed for {from_currency}-{to_currency}: {e}")

    logger.warning(f"Failed to get rate for {from_currency} to {to_currency}")
    return None


class CategoryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        queryset = Transaction.objects.filter(user=request.user).values_list('category', flat=True).distinct()
        serializer = CategorySerializer([{'name': category} for category in queryset], many=True)
        return Response(serializer.data)


import logging

logger = logging.getLogger(__name__)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.exception("Error in TransactionViewSet list method:")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        user = self.request.user
        queryset = Transaction.objects.filter(user=user).order_by('-date')

        account_id = self.request.query_params.get('account')
        if account_id and account_id != 'all':
            queryset = queryset.filter(account__id=account_id)

        category = self.request.query_params.get('category')
        if category and category != 'all':
            queryset = queryset.filter(category__name=category)

        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type and transaction_type != 'all':
            queryset = queryset.filter(transaction_type=transaction_type)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        elif start_date:
            queryset = queryset.filter(date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset

    def perform_create(self, serializer):
        with db_transaction.atomic():
            transaction = serializer.save(account=self.get_account_from_request())
            self.update_account_balance(transaction)

    def perform_update(self, serializer):
        with db_transaction.atomic():
            old_transaction = Transaction.objects.get(pk=serializer.instance.pk)
            updated_transaction = serializer.save()
            self.revert_account_balance(old_transaction)
            self.update_account_balance(updated_transaction)

    def perform_destroy(self, instance):
        with db_transaction.atomic():
            self.revert_account_balance(instance)
            instance.delete()

    def get_account_from_request(self):
        account_id = self.request.data.get('account')
        if not account_id:
            raise serializers.ValidationError({"account": "This field is required."})
        try:
            account = Account.objects.get(id=account_id, owner=self.request.user)
        except Account.DoesNotExist:
            raise serializers.ValidationError({"account": "Account not found or does not belong to the user."})
        return account

    def update_account_balance(self, transaction):
        account = transaction.account
        if transaction.transaction_type == 'income':
            account.balance += transaction.amount
        elif transaction.transaction_type == 'expense':
            account.balance -= transaction.amount
        elif transaction.transaction_type == 'transfer':
            # For transfers, the amount is deducted from the source account
            # and added to the destination account.
            # This logic assumes 'transfer_to_account' is handled in the serializer
            # and the amount is positive.
            pass # Balance update for transfers is more complex and might be handled elsewhere or needs explicit handling
        account.save()

    def revert_account_balance(self, transaction):
        account = transaction.account
        if transaction.transaction_type == 'income':
            account.balance -= transaction.amount
        elif transaction.transaction_type == 'expense':
            account.balance += transaction.amount
        elif transaction.transaction_type == 'transfer':
            pass # Revert logic for transfers is complex
        account.save()

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.accounts.all()

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BalanceSnapshotViewSet(viewsets.ModelViewSet):
    serializer_class = BalanceSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.request.user.balance_snapshots.all()
        account_id = self.request.query_params.get('account')
        if account_id:
            queryset = queryset.filter(account__id=account_id)
        return queryset

    def perform_create(self, serializer):
        snapshot = serializer.save(user=self.request.user)
        account = snapshot.account
        account.balance = snapshot.balance
        account.save()

    def perform_update(self, serializer):
        snapshot = serializer.save()
        account = snapshot.account
        account.balance = snapshot.balance
        account.save()

class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.assets.all().order_by('id')

    def perform_create(self, serializer):
        price_per_unit = serializer.validated_data.get('price')
        quantity = serializer.validated_data.get('quantity')

        # Recalculate cost on backend to ensure correctness
        cost = price_per_unit * quantity

        # At creation, market price is the same as purchase price
        market_price = price_per_unit
        market_value = market_price * quantity
        
        change = 0 # Change is always 0 at creation

        serializer.save(
            user=self.request.user,
            cost=cost, # Overwrite cost
            market_price=market_price,
            market_value=market_value,
            change=change
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        price_per_unit = serializer.validated_data.get('price', instance.price)
        quantity = serializer.validated_data.get('quantity', instance.quantity)
        
        cost = price_per_unit * quantity

        market_price = serializer.validated_data.get('market_price', instance.market_price)
        
        market_value = market_price * quantity
        if cost > 0:
            change = ((market_value - cost) / cost) * 100
        else:
            change = 0

        serializer.save(
            cost=cost,
            market_price=market_price,
            market_value=market_value,
            change=change
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_asset_details(request):
    symbol = request.query_params.get('symbol', None)
    asset_type = request.query_params.get('type', 'stocks')

    if not symbol:
        return Response({'error': 'Symbol parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if asset_type == 'crypto':
            symbol = f'{symbol}-USD'

        ticker = yf.Ticker(symbol)
        info = ticker.info

        price = info.get('regularMarketPrice')
        name = info.get('longName', info.get('shortName'))

        if price and name:
            return Response({'price': price, 'name': name})
        else:
            # Fallback for symbols that might not have 'regularMarketPrice'
            hist = ticker.history(period="1d")
            if not hist.empty:
                price = hist['Close'].iloc[-1]
                if not name:
                    name = symbol # Fallback name
                return Response({'price': price, 'name': name})

            return Response({'error': 'Could not fetch data for the given symbol'}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.error(f"An error occurred while fetching data for {symbol}: {e}")
        return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

import requests

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_symbols(request):
    keywords = request.query_params.get('keywords', None)

    if not keywords:
        return Response({'error': 'Keywords parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        url = f"https://query1.finance.yahoo.com/v1/finance/search?q={keywords}"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'}
        response = requests.get(url, headers=headers)
        data = response.json()
        results = []
        for item in data['quotes']:
            results.append({'symbol': item['symbol'], 'name': item.get('longname', item.get('shortname', ''))})
        return Response(results)

    except Exception as e:
        logger.error(f"An error occurred while searching for symbols: {e}")
        return Response([], status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_portfolio_summary(request):
    user = request.user
    user_profile = UserProfile.objects.get(user=user)
    preferred_currency = user_profile.preferred_currency

    accounts = Account.objects.filter(user=user)
    total_portfolio_value = Decimal('0.0')
    cash_balance = Decimal('0.0')

    for account in accounts:
        converted_balance = convert_currency(account.balance, account.currency, preferred_currency)
        if converted_balance is not None:
            total_portfolio_value += converted_balance
            if account.account_type == 'cash':
                cash_balance += converted_balance
        else:
            logger.warning(f"Could not convert account balance for account {account.id}")

    # --- Today's Change Calculation ---
    yesterday = timezone.now().date() - timedelta(days=1)
    yesterday_portfolio_value = Decimal('0.0')
    for account in accounts:
        latest_snapshot = BalanceSnapshot.objects.filter(account=account, date__lte=yesterday).order_by('-date').first()
        if latest_snapshot:
            converted_snapshot_balance = convert_currency(latest_snapshot.balance, account.currency, preferred_currency)
            if converted_snapshot_balance:
                yesterday_portfolio_value += converted_snapshot_balance

    todays_change_value = total_portfolio_value - yesterday_portfolio_value
    todays_change_percentage = (todays_change_value / yesterday_portfolio_value) * 100 if yesterday_portfolio_value else Decimal('0.0')

    # --- Annual Return Calculation ---
    one_year_ago = timezone.now().date() - timedelta(days=365)
    past_portfolio_value = Decimal('0.0')
    for account in accounts:
        latest_snapshot = BalanceSnapshot.objects.filter(account=account, date__lte=one_year_ago).order_by('-date').first()
        if latest_snapshot:
            converted_snapshot_balance = convert_currency(latest_snapshot.balance, account.currency, preferred_currency)
            if converted_snapshot_balance:
                past_portfolio_value += converted_snapshot_balance
    
    annual_return_percentage = ((total_portfolio_value - past_portfolio_value) / past_portfolio_value) * 100 if past_portfolio_value else Decimal('0.0')

    return Response({
        'total_portfolio_value': total_portfolio_value,
        'todays_change_value': todays_change_value,
        'todays_change_percentage': todays_change_percentage,
        'annual_return_percentage': annual_return_percentage,
        'cash_balance': cash_balance,
        'preferred_currency': preferred_currency,
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_transaction_summary(request):
    user = request.user
    user_profile = UserProfile.objects.get(user=user)
    preferred_currency = user_profile.preferred_currency

    transactions = Transaction.objects.filter(user=user)

    total_income = Decimal('0.0')
    total_expense = Decimal('0.0')

    for transaction in transactions:
        converted_amount = convert_currency(transaction.amount, transaction.currency, preferred_currency)
        if converted_amount is None:
            logger.warning(f"Could not convert transaction amount for transaction {transaction.id} from {transaction.currency} to {preferred_currency}. Skipping this transaction from summary.")
            continue

        if transaction.transaction_type == 'income':
            total_income += converted_amount
        else: # expense
            total_expense += converted_amount

    net_balance = total_income - total_expense

    return Response({
        'total_income': total_income,
        'total_expense': total_expense,
        'net_balance': net_balance,
        'preferred_currency': preferred_currency,
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_asset_allocation(request):
    user = request.user
    user_profile = UserProfile.objects.get(user=user)
    preferred_currency = user_profile.preferred_currency

    accounts = Account.objects.filter(user=user)
    account_type_allocation = {}

    for account in accounts:
        if account.account_type not in account_type_allocation:
            account_type_allocation[account.account_type] = Decimal('0.0')

        converted_balance = convert_currency(account.balance, account.currency, preferred_currency)
        if converted_balance is not None:
            account_type_allocation[account.account_type] += converted_balance
        else:
            logger.warning(f"Could not convert account balance for account {account.id} from {account.currency} to {preferred_currency}")

    return Response(account_type_allocation)