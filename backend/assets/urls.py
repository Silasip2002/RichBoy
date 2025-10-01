from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssetViewSet,
    get_asset_details,
    search_symbols
)

router = DefaultRouter()
router.register(r'assets', AssetViewSet, basename='asset')

urlpatterns = [
    path('', include(router.urls)),
    path('get_asset_details/', get_asset_details, name='get_asset_details'),
    path('search_symbols/', search_symbols, name='search_symbols'),
]
