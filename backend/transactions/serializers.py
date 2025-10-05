from rest_framework import serializers
from .models import Transaction, CURRENCY_CHOICES, Budget

class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    currency = serializers.ChoiceField(choices=CURRENCY_CHOICES)

    class Meta:
        model = Transaction
        fields = '__all__'

    def validate_account(self, value):
        """Check that the account belongs to the current user."""
        if value.user != self.context['request'].user:
            raise serializers.ValidationError("You do not have permission to access this account.")
        return value

    def update(self, instance, validated_data):
        # Get the old amount and type before the update
        old_amount = instance.amount
        old_type = instance.transaction_type

        # Get the account
        account = instance.account

        # Revert the old transaction's effect on the balance
        if old_type == 'income':
            account.balance -= old_amount
        else: # expense
            account.balance += old_amount

        # Apply the new transaction's effect on the balance
        new_amount = validated_data.get('amount', old_amount)
        new_type = validated_data.get('transaction_type', old_type)

        if new_type == 'income':
            account.balance += new_amount
        else: # expense
            account.balance -= new_amount
        
        account.save()

        # Save the updated transaction
        return super().update(instance, validated_data)

class CategorySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)

class BudgetSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    spent_amount = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = '__all__'

    def get_spent_amount(self, obj):
        from .models import Transaction
        from django.db.models import Sum
        import datetime

        today = datetime.date.today()
        if obj.period == 'Month':
            start_date = today.replace(day=1)
            end_date = (start_date + datetime.timedelta(days=32)).replace(day=1) - datetime.timedelta(days=1)
        else: # Year
            start_date = today.replace(month=1, day=1)
            end_date = today.replace(month=12, day=31)

        # Get all expense transactions for this budget category and period
        transactions = Transaction.objects.filter(
            user=obj.user,
            category=obj.category,
            transaction_type='expense',
            date__range=[start_date, end_date]
        )

        total_spent = 0
        from accounts.views import convert_currency

        for transaction in transactions:
            transaction_amount = transaction.amount
            # Convert transaction amount to budget's currency if they're different
            if transaction.currency != obj.currency:
                converted_amount = convert_currency(transaction_amount, transaction.currency, obj.currency)
                if converted_amount is not None:
                    total_spent += converted_amount
                else:
                    # Fallback: use original amount if conversion fails
                    total_spent += transaction_amount
            else:
                total_spent += transaction_amount

        return total_spent