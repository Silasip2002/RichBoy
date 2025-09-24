from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet, 
    AccountViewSet, 
    AssetViewSet, 
    get_asset_details, 
    search_symbols,
    CategoryViewSet,
    get_portfolio_summary,
    get_asset_allocation
    ) 
    
router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'assets', AssetViewSet, basename='asset')
router.register(r'categories', CategoryViewSet, basename='category')
# Specific paths must come BEFORE the router include
urlpatterns = [
    path('get_asset_allocation/', get_asset_allocation, name='get_asset_allocation'),
    path('get_portfolio_summary/', get_portfolio_summary, name='get_portfolio_summary'),
    path('get_asset_details/', get_asset_details, name='get_asset_details'),
    path('search_symbols/', search_symbols, name='search_symbols'),
    path('', include(router.urls)),
]
