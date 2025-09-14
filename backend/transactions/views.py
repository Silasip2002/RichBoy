from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import requests
from django.conf import settings
from .models import Transaction, Account, Asset
from .serializers import TransactionSerializer, AccountSerializer, AssetSerializer

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
        return self.request.user.assets.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_stock_price(request):
    symbol = request.query_params.get('symbol', None)
    if not symbol:
        return Response({'error': 'Symbol parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = settings.ALPHA_VANTAGE_API_KEY
    url = f'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={api_key}'

    try:
        response = requests.get(url)
        data = response.json()
        if 'Global Quote' in data and '05. price' in data['Global Quote']:
            price = data['Global Quote']['05. price']
            return Response({'price': price})
        else:
            return Response({'error': 'Could not fetch price for the given symbol'}, status=status.HTTP_404_NOT_FOUND)
    except requests.exceptions.RequestException as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
