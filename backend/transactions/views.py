from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import logging
import yfinance as yf
import requests
from users.models import UserProfile
from .models import Transaction, Account, Asset, ExchangeRate
from .serializers import TransactionSerializer, AccountSerializer, AssetSerializer, CategorySerializer
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
        # If direct conversion not found, try via USD (or another common base)
        # This assumes all rates are stored relative to USD
        if from_currency != 'USD' and to_currency != 'USD':
            try:
                # Convert from_currency to USD
                rate_to_usd = ExchangeRate.objects.get(base_currency=from_currency, target_currency='USD').rate
                amount_in_usd = amount * rate_to_usd
                # Convert USD to to_currency
                rate_from_usd = ExchangeRate.objects.get(base_currency='USD', target_currency=to_currency).rate
                return amount_in_usd * rate_from_usd
            except ExchangeRate.DoesNotExist:
                # Handle cases where intermediate rates are missing
                return None # Or raise an error, or return original amount
        else:
            return None # Or raise an error, or return original amount
    except Exception as e:
        logger.error(f"Error during currency conversion from {from_currency} to {to_currency}: {e}")
        return None


class CategoryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        queryset = Transaction.objects.filter(user=request.user).values_list('category', flat=True).distinct()
        serializer = CategorySerializer([{'name': category} for category in queryset], many=True)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.transactions.all()

    def perform_create(self, serializer):
        transaction = serializer.save(user=self.request.user)
        account = transaction.account
        if transaction.transaction_type == 'income':
            account.balance += transaction.amount
        else:
            account.balance -= transaction.amount
        account.save()



    def perform_destroy(self, instance):
        account = instance.account
        if instance.transaction_type == 'income':
            account.balance -= instance.amount
        else:
            account.balance += instance.amount
        account.save()
        instance.delete()

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.accounts.all()

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)







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
    user_profile = UserProfile.objects.get(user=user) # Get user profile
    preferred_currency = user_profile.preferred_currency # Get preferred currency

    assets = Asset.objects.filter(user=user)
    accounts = Account.objects.filter(user=user)

    total_portfolio_value = Decimal('0.0')
    total_cost = Decimal('0.0')

    for asset in assets:
        # Convert asset market_value to preferred_currency
        converted_market_value = convert_currency(asset.market_value, asset.account.currency, preferred_currency)
        if converted_market_value is not None:
            total_portfolio_value += converted_market_value
        else:
            logger.warning(f"Could not convert asset market value for asset {asset.id} from {asset.account.currency} to {preferred_currency}")
            # Decide how to handle unconvertible assets: skip, use original, or error

        # Convert asset cost to preferred_currency
        converted_cost = convert_currency(asset.cost, asset.account.currency, preferred_currency)
        if converted_cost is not None:
            total_cost += converted_cost
        else:
            logger.warning(f"Could not convert asset cost for asset {asset.id} from {asset.account.currency} to {preferred_currency}")
            # Decide how to handle unconvertible assets: skip, use original, or error

    todays_change = Decimal('0.0')
    if total_cost > 0:
        todays_change = ((total_portfolio_value - total_cost) / total_cost) * 100

    cash_balance = Decimal('0.0')
    for account in accounts:
        if account.account_type == 'cash':
            # Convert cash account balance to preferred_currency
            converted_balance = convert_currency(account.balance, account.currency, preferred_currency)
            if converted_balance is not None:
                cash_balance += converted_balance
            else:
                logger.warning(f"Could not convert cash balance for account {account.id} from {account.currency} to {preferred_currency}")
                # Decide how to handle unconvertible cash balances: skip, use original, or error


    return Response({
        'total_portfolio_value': total_portfolio_value,
        'todays_change': todays_change,
        'cash_balance': cash_balance,
        'preferred_currency': preferred_currency, # Return the currency used for calculation
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
    assets = Asset.objects.filter(user=user)
    asset_allocation = {}
    for asset in assets:
        if asset.asset_type not in asset_allocation:
            asset_allocation[asset.asset_type] = 0
        asset_allocation[asset.asset_type] += asset.market_value

    return Response(asset_allocation)