from django.db import models
from django.contrib.auth.models import User

ACCOUNT_CHOICES = [
    ('cash', 'Cash'),
    ('bank', 'Bank'),
]

class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    CURRENCY_CHOICES = [
        ('USD', 'USD'),
        ('HKD', 'HKD'),
        ('RMB', 'RMB'),
        ('CAD', 'CAD'),
    ]
    CATEGORY_CHOICES = [
        ('food', 'Food'),
        ('transportation', 'Transportation'),
        ('salary', 'Salary'),
        ('utilities', 'Utilities'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=7, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    date = models.DateField()
    is_recurring = models.BooleanField(default=False)
    account = models.CharField(max_length=20, choices=ACCOUNT_CHOICES, default='cash')

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - {self.amount} {self.currency} - {self.date}"

class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_CHOICES, default='bank')

    def __str__(self):
        return self.name

class Asset(models.Model):
    ASSET_TYPE_CHOICES = [
        ('stocks', 'Stocks'),
        ('crypto', 'Cryptocurrency'),
        ('real_estate', 'Real Estate'),
        ('cash', 'Cash'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assets')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=10, blank=True, null=True)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.DecimalField(max_digits=10, decimal_places=4)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.name}"