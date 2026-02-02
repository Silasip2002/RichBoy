from django.db import models
from django.contrib.auth.models import User

CURRENCY_CHOICES = [
    ('USD', 'USD - United States Dollar'),
    ('EUR', 'EUR - Euro'),
    ('JPY', 'JPY - Japanese Yen'),
    ('GBP', 'GBP - British Pound Sterling'),
    ('AUD', 'AUD - Australian Dollar'),
    ('CAD', 'CAD - Canadian Dollar'),
    ('CHF', 'CHF - Swiss Franc'),
    ('CNY', 'CNY - Chinese Yuan'),
    ('SEK', 'SEK - Swedish Krona'),
    ('NZD', 'NZD - New Zealand Dollar'),
    ('HKD', 'HKD - Hong Kong Dollar'),
]

ACCOUNT_CHOICES = [
    ('cash', 'Cash'),
    ('credit_card', 'Credit Card'),
    ('investment', 'Investment'),
    ('crypto', 'Crypto'),
    ('bond', 'Bond'),
    ('loan', 'Loan'),
    ('other', 'Other'),
]

class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_CHOICES, default='cash')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')

    def __str__(self):
        return self.name

class BalanceSnapshot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='balance_snapshots')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='balance_snapshots')
    date = models.DateField()
    balance = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        ordering = ['-date']
        unique_together = ('account', 'date')

    def __str__(self):
        return f'{self.account.name} - {self.date} - {self.balance}'