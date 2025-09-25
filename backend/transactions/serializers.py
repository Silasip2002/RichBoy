from rest_framework import serializers
from .models import Transaction, Account, Asset, CURRENCY_CHOICES

class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    currency = serializers.ChoiceField(choices=CURRENCY_CHOICES)

    class Meta:
        model = Transaction
        fields = '__all__'

class AccountSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Account
        fields = '__all__'

class AssetSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Asset
        fields = '__all__'
        read_only_fields = ('market_value', 'change')

class CategorySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
