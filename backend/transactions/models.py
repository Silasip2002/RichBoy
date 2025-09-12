from django.db import models
from django.contrib.auth.models import User

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

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - {self.amount} {self.currency} - {self.date}"
