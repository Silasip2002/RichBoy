from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet, 
    AccountViewSet, 
    AssetViewSet, 
    get_stock_price, 
    search_symbols
)

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'assets', AssetViewSet, basename='asset')

# Specific paths must come BEFORE the router include
urlpatterns = [
    path('get_stock_price/', get_stock_price, name='get_stock_price'),
    path('search_symbols/', search_symbols, name='search_symbols'),
    path('', include(router.urls)),
]
