from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet,
    BalanceSnapshotViewSet,
    get_portfolio_summary,
    get_asset_allocation,
    get_transaction_summary,
    get_portfolio_growth
)

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'balance-snapshots', BalanceSnapshotViewSet, basename='balance-snapshot')

urlpatterns = [
    path('', include(router.urls)),
    path('get_portfolio_summary/', get_portfolio_summary, name='get_portfolio_summary'),
    path('get_asset_allocation/', get_asset_allocation, name='get_asset_allocation'),
    path('get_transaction_summary/', get_transaction_summary, name='get_transaction_summary'),
    path('get_portfolio_growth/', get_portfolio_growth, name='get_portfolio_growth'),
]
