from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import requests
import logging
from django.conf import settings
from .models import Transaction, Account, Asset
from .serializers import TransactionSerializer, AccountSerializer, AssetSerializer

logger = logging.getLogger(__name__)


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
        serializer.save(user=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_stock_price(request):
    symbol = request.query_params.get('symbol', None)
    if not symbol:
        return Response({'error': 'Symbol parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = settings.ALPHA_VANTAGE_API_KEY
    
    # Fetch Price
    price_url = f'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={api_key}'
    
    # Fetch Name
    search_url = f'https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={symbol}&apikey={api_key}'

    try:
        price_response = requests.get(price_url)
        price_data = price_response.json()
        logger.error(f"Alpha Vantage Price Response for {symbol}: {price_data}")

        if "Note" in price_data:
            return Response({'error': 'Alpha Vantage API rate limit exceeded.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        search_response = requests.get(search_url)
        search_data = search_response.json()
        logger.error(f"Alpha Vantage Search Response for {symbol}: {search_data}")


        price = None
        name = None

        if 'Global Quote' in price_data and '05. price' in price_data['Global Quote']:
            price = price_data['Global Quote']['05. price']
        
        if 'bestMatches' in search_data and len(search_data['bestMatches']) > 0:
            # Find the best match for the symbol
            best_match = next((match for match in search_data['bestMatches'] if match['1. symbol'].upper() == symbol.upper()), None)
            if best_match:
                name = best_match['2. name']

        if price is not None and name is not None:
            return Response({'price': price, 'name': name})
        elif price is not None:
            return Response({'price': price, 'name': ''}) # Return price even if name not found
        else:
            return Response({'error': 'Could not fetch data for the given symbol'}, status=status.HTTP_404_NOT_FOUND)
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed for {symbol}: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_symbols(request):
    keywords = request.query_params.get('keywords', None)
    if not keywords:
        return Response({'error': 'Keywords parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = settings.ALPHA_VANTAGE_API_KEY
    url = f'https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={keywords}&apikey={api_key}'

    try:
        response = requests.get(url)
        data = response.json()
        if 'bestMatches' in data:
            results = [{'symbol': item['1. symbol'], 'name': item['2. name']} for item in data['bestMatches']]
            return Response(results)
        else:
            return Response([], status=status.HTTP_200_OK)
    except requests.exceptions.RequestException as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)