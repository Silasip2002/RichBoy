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
    ('bank', 'Bank'),
    ('credit_card', 'Credit Card'),
    ('investment', 'Investment'),
    ('loan', 'Loan'),
    ('other', 'Other'),
]

class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_CHOICES, default='bank')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')

    def __str__(self):
        return self.name

class ExchangeRate(models.Model):
    base_currency = models.CharField(max_length=3)
    target_currency = models.CharField(max_length=3)
    rate = models.DecimalField(max_digits=20, decimal_places=10)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('base_currency', 'target_currency')

    def __str__(self):
        return f"1 {self.base_currency} = {self.rate} {self.target_currency}"

class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    CATEGORY_CHOICES = [
        ('salary', 'Salary'),
        ('freelance', 'Freelance'),
        ('investment', 'Investment'),
        ('food', 'Food'),
        ('transportation', 'Transportation'),
        ('housing', 'Housing'),
        ('utilities', 'Utilities'),
        ('entertainment', 'Entertainment'),
        ('health', 'Health'),
        ('education', 'Education'),
        ('shopping', 'Shopping'),
        ('other', 'Other'),
        ('other_expense', 'Other Expense'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=7, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    date = models.DateField()
    is_recurring = models.BooleanField(default=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions_for_account')

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
    symbol = models.CharField(max_length=30, blank=True, null=True)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Cost per unit at time of purchase")
    quantity = models.DecimalField(max_digits=10, decimal_places=4)
    cost = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    market_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    market_value = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    change = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.name}"