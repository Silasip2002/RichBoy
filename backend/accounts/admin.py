from django.contrib import admin
from .models import Account, BalanceSnapshot

admin.site.register(Account)
admin.site.register(BalanceSnapshot)