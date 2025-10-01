from rest_framework import serializers
from .models import Account, BalanceSnapshot, CURRENCY_CHOICES

class AccountSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Account
        fields = '__all__'

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class BalanceSnapshotSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    class Meta:
        model = BalanceSnapshot
        fields = '__all__'
