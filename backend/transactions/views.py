from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import logging
import yfinance as yf
import requests
from .models import Transaction, Account, Asset
from .serializers import TransactionSerializer, AccountSerializer, AssetSerializer, CategorySerializer

logger = logging.getLogger(__name__)


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
        serializer.save(user=self.request.user)

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.accounts.all()

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
    assets = Asset.objects.filter(user=user)
    accounts = Account.objects.filter(user=user)

    total_portfolio_value = 0
    total_cost = 0
    for asset in assets:
        total_portfolio_value += asset.market_value
        total_cost += asset.cost

    todays_change = 0
    if total_cost > 0:
        todays_change = ((total_portfolio_value - total_cost) / total_cost) * 100

    cash_balance = 0
    for account in accounts:
        if account.account_type == 'cash':
            cash_balance += account.balance

    return Response({
        'total_portfolio_value': total_portfolio_value,
        'todays_change': todays_change,
        'cash_balance': cash_balance,
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