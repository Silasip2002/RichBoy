from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import requests
import logging
import time
from django.conf import settings
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
def get_stock_price(request):
    symbol = request.query_params.get('symbol', None)
    asset_type = request.query_params.get('type', 'stocks')
    if not symbol:
        return Response({'error': 'Symbol parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = settings.FINNHUB_API_KEY
    base_url = settings.FINNHUB_API_URL
    
    try:
        if asset_type == 'crypto':
            # It's a crypto symbol
            end_time = int(time.time())
            start_time = end_time - 86400 * 2 # 2 days ago to make sure we get a candle

            url = f'{base_url}/crypto/candle?symbol={symbol}&resolution=D&from={start_time}&to={end_time}&token={api_key}'
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()

            if data.get('s') == 'ok' and data.get('c') and data['c']:
                price = data['c'][-1] # last closing price
                # Construct name from symbol
                _, pair = symbol.split(':')
                name = pair.replace('USDT', '/USD') 
                return Response({'price': price, 'name': name})
            else:
                logger.error(f"Finnhub crypto response for {symbol}: {data}")
                return Response({'error': 'Could not fetch data for the given crypto symbol'}, status=status.HTTP_404_NOT_FOUND)

        else: # It's a stock symbol
            # Fetch Price
            price_url = f'{base_url}/quote?symbol={symbol}&token={api_key}'
            price_response = requests.get(price_url)
            price_response.raise_for_status()
            price_data = price_response.json()

            # Fetch Name/Profile
            profile_url = f'{base_url}/stock/profile2?symbol={symbol}&token={api_key}'
            profile_response = requests.get(profile_url)
            profile_response.raise_for_status()
            profile_data = profile_response.json()

            price = price_data.get('c')
            name = profile_data.get('name')

            if price is not None and price != 0:
                return Response({'price': price, 'name': name if name else ''})
            else:
                logger.error(f"Finnhub stock response for {symbol}: price_data={price_data}, profile_data={profile_data}")
                return Response({'error': 'Could not fetch data for the given stock symbol'}, status=status.HTTP_404_NOT_FOUND)

    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed for {symbol}: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"An error occurred while fetching price for {symbol}: {e}")
        return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_symbols(request):
    keywords = request.query_params.get('keywords', None)
    asset_type = request.query_params.get('type', 'stocks')

    if not keywords:
        return Response({'error': 'Keywords parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = settings.FINNHUB_API_KEY
    base_url = settings.FINNHUB_API_URL

    if asset_type == 'crypto':
        # For crypto, we'll search symbols from a major exchange like Binance
        exchange = 'binance'
        url = f'{base_url}/crypto/symbol?exchange={exchange}&token={api_key}'
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data:
                # item is {'description': 'Binance BTC/USDT', 'displaySymbol': 'BTC/USDT', 'symbol': 'BINANCE:BTCUSDT'}
                if keywords.lower() in item['description'].lower() or keywords.lower() in item['displaySymbol'].lower():
                    results.append({'symbol': item['symbol'], 'name': item['description']})
            
            return Response(results[:100])

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch crypto list: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else: # For stocks and other types
        url = f'{base_url}/search?q={keywords}&token={api_key}'
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()

            if 'result' in data:
                # data['result'] is [{'description': 'APPLE INC', 'displaySymbol': 'AAPL', 'symbol': 'AAPL', 'type': 'Common Stock'}]
                results = [{'symbol': item['symbol'], 'name': item['description']} for item in data['result']]
                return Response(results)
            else:
                return Response([], status=status.HTTP_200_OK)
        except (requests.exceptions.RequestException, ValueError) as e: # ValueError for json decoding
            logger.error(f"Failed to search stock symbols for {keywords}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)