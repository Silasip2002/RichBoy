from django.contrib import admin
from .models import Transaction, Account, Asset

admin.site.register(Transaction)
admin.site.register(Account)
admin.site.register(Asset)
