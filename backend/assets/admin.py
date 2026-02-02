from django.contrib import admin
from .models import Asset, ExchangeRate

admin.site.register(Asset)
admin.site.register(ExchangeRate)