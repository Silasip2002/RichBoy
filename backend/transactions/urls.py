from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, AccountViewSet, AssetViewSet, get_stock_price

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'assets', AssetViewSet, basename='asset')

urlpatterns = [
    path('', include(router.urls)),
    path('get_stock_price/', get_stock_price, name='get_stock_price'),
]
