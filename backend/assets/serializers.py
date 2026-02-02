from rest_framework import serializers
from .models import Asset

class AssetSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Asset
        fields = '__all__'
        read_only_fields = ('market_value', 'change')
