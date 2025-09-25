from rest_framework import serializers
from .models import Transaction, Account, Asset, CURRENCY_CHOICES

class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    currency = serializers.ChoiceField(choices=CURRENCY_CHOICES)

    class Meta:
        model = Transaction
        fields = '__all__'

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

class AccountSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Account
        fields = '__all__'

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class AssetSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Asset
        fields = '__all__'
        read_only_fields = ('market_value', 'change')

class CategorySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
