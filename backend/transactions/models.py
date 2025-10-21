from django.db import models
from django.contrib.auth.models import User
import uuid

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

class Budget(models.Model):
    PERIOD_CHOICES = [
        ('Month', 'Month'),
        ('Year', 'Year'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=20, choices=Transaction.CATEGORY_CHOICES)
    budgeted_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES)
    period = models.CharField(max_length=5, choices=PERIOD_CHOICES)

    def __str__(self):
        return f"{self.user.username}'s {self.get_category_display()} Budget ({self.get_period_display()})"


class Goal(models.Model):
    CATEGORY_CHOICES = [
        ('savings', 'Savings'),
        ('debt_repayment', 'Debt Repayment'),
        ('investment', 'Investment'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField()
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deadline = models.DateField(null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Goal: {self.title}"

    @property
    def progress_percentage(self):
        if self.target_amount == 0:
            return 0
        return min((self.current_amount / self.target_amount) * 100, 100)


class Milestone(models.Model):
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('in_progress', 'In Progress'),
        ('upcoming', 'Upcoming'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    target_date = models.DateField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')

    # Enhanced fields from AI coach
    calculation = models.TextField(blank=True, null=True)
    accordion_details = models.TextField(blank=True, null=True)
    timeline = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Milestone: {self.title} (Goal: {self.goal.title})"


class FinancialProduct(models.Model):
    PRODUCT_TYPE_CHOICES = [
        ('savings_account', 'Savings Account'),
        ('investment', 'Investment'),
        ('insurance', 'Insurance'),
        ('loan', 'Loan'),
        ('credit_card', 'Credit Card'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name='products')
    type = models.CharField(max_length=20, choices=PRODUCT_TYPE_CHOICES, blank=True, null=True)
    name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    percentage = models.CharField(max_length=10, blank=True, null=True)  # Store as string to handle percentages like "15%"

    def __str__(self):
        return f"Product: {self.name} ({self.amount})"
