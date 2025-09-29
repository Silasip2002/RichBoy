from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import requests
import logging
from django.conf import settings
from .models import Transaction, Account, Asset, BalanceSnapshot
from .serializers import TransactionSerializer, AccountSerializer, AssetSerializer, CategorySerializer, BalanceSnapshotSerializer

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

class BalanceSnapshotViewSet(viewsets.ModelViewSet):
    serializer_class = BalanceSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.balance_snapshots.all()

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
    asset_type = request.query_params.get('type', 'stocks')

    if not keywords:
        return Response({'error': 'Keywords parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = settings.ALPHA_VANTAGE_API_KEY

    if asset_type == 'crypto':
        url = 'https://www.alphavantage.co/digital_currency_list/'
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            import csv
            import io
            
            results = []
            csv_file = io.StringIO(response.text)
            reader = csv.reader(csv_file)
            
            try:
                next(reader) # Skip header row
            except StopIteration:
                return Response([]) # Empty file

            for row in reader:
                if len(row) == 2:
                    symbol, name = row
                    if keywords.lower() in symbol.lower() or keywords.lower() in name.lower():
                        results.append({'symbol': symbol, 'name': name})
            
            return Response(results[:100])

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch crypto list: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else: # For stocks and other types
        url = f'https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={keywords}&apikey={api_key}'
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()

            if "Note" in data:
                logger.warning(f"Alpha Vantage API rate limit likely exceeded when searching for {keywords}.")
                return Response([], status=status.HTTP_200_OK)

            if 'bestMatches' in data:
                results = [{'symbol': item['1. symbol'], 'name': item['2. name']} for item in data['bestMatches']]
                return Response(results)
            else:
                return Response([], status=status.HTTP_200_OK)
        except (requests.exceptions.RequestException, ValueError) as e: # ValueError for json decoding
            logger.error(f"Failed to search stock symbols for {keywords}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)