from django.db import models
from django.contrib.auth.models import User

class ExchangeRate(models.Model):
    base_currency = models.CharField(max_length=3)
    target_currency = models.CharField(max_length=3)
    rate = models.DecimalField(max_digits=20, decimal_places=10)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('base_currency', 'target_currency')

    def __str__(self):
        return f"1 {self.base_currency} = {self.rate} {self.target_currency}"

class Asset(models.Model):
    ASSET_TYPE_CHOICES = [
        ('stocks', 'Stocks'),
        ('crypto', 'Cryptocurrency'),
        ('real_estate', 'Real Estate'),
        ('cash', 'Cash'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assets')
    account = models.ForeignKey('accounts.Account', on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=30, blank=True, null=True)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=6, help_text="Cost per unit at time of purchase")
    quantity = models.DecimalField(max_digits=10, decimal_places=4)
    cost = models.DecimalField(max_digits=20, decimal_places=6, null=True, blank=True)
    market_price = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    market_value = models.DecimalField(max_digits=20, decimal_places=6, null=True, blank=True)
    previous_market_value = models.DecimalField(max_digits=20, decimal_places=6, null=True, blank=True)
    change = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.name}"