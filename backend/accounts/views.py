from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from .models import Account, BalanceSnapshot
from .serializers import AccountSerializer, BalanceSnapshotSerializer
from assets.models import ExchangeRate
from transactions.models import Transaction
from users.models import UserProfile

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
                import yfinance as yf
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
        queryset = BalanceSnapshot.objects.filter(user=self.request.user)
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

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_portfolio_growth(request):
    user = request.user
    user_profile = UserProfile.objects.get(user=user)
    preferred_currency = user_profile.preferred_currency

    all_accounts = Account.objects.filter(user=user)
    
    # Get all unique dates from all snapshots for the user
    all_snapshot_dates = BalanceSnapshot.objects.filter(user=user).values_list('date', flat=True).distinct().order_by('date')

    portfolio_growth_data = {}

    for date in all_snapshot_dates:
        current_date_total = Decimal('0.0')
        for account in all_accounts:
            # Find the latest snapshot for this account on or before the current date
            latest_snapshot = BalanceSnapshot.objects.filter(
                account=account,
                date__lte=date
            ).order_by('-date').first()

            if latest_snapshot:
                converted_balance = convert_currency(latest_snapshot.balance, account.currency, preferred_currency)
                if converted_balance is not None:
                    current_date_total += converted_balance
                else:
                    logger.warning(f"Could not convert snapshot balance for account {account.id} on {date.isoformat()}")

        portfolio_growth_data[date.isoformat()] = current_date_total

    # Convert to a list of objects for the frontend
    response_data = [
        {'date': date, 'total_balance': balance}
        for date, balance in portfolio_growth_data.items()
    ]
    
    # Filter by timeframe if provided
    timeframe = request.query_params.get('timeframe', 'all')
    now = timezone.now().date()
    
    if timeframe == '1w':
        start_date = now - timedelta(weeks=1)
        response_data = [d for d in response_data if datetime.fromisoformat(d['date']).date() >= start_date]
    elif timeframe == '1m':
        start_date = now - timedelta(days=30)
        response_data = [d for d in response_data if datetime.fromisoformat(d['date']).date() >= start_date]
    elif timeframe == '5y':
        start_date = now - timedelta(days=5*365)
        response_data = [d for d in response_data if datetime.fromisoformat(d['date']).date() >= start_date]
    
    # Sort by date to ensure correct line chart display
    response_data.sort(key=lambda x: x['date'])

    return Response(response_data)