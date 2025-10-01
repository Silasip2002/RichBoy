from django.db import models
from django.contrib.auth.models import User

# Duplicating choices to avoid circular imports during refactoring.
# A better long-term solution is a shared choices module.
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
    account = models.ForeignKey('accounts.Account', on_delete=models.CASCADE, related_name='transactions_for_account')
