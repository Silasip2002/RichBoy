from django.contrib.auth.models import User
from .models import UserProfile
from .serializers import UserSerializerWithToken, UserProfileSerializer, UserSerializerForToken
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView

import subprocess # Import subprocess
from datetime import datetime, timedelta # Import datetime and timedelta
from django.utils import timezone # Import timezone
from transactions.models import ExchangeRate # Import ExchangeRate model
import os # Import os
import sys # Import sys

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        serializer = UserSerializerForToken(self.user).data
        for k, v in serializer.items():
            data[k] = v

        # --- Currency Rate Update Logic ---
        # Check if rates need to be updated
        last_update_threshold = timezone.now() - timedelta(hours=1) # Rates older than 1 hour are stale

        # Check if any ExchangeRate object exists and its last_updated is older than the threshold
        # Or if no ExchangeRate objects exist at all
        rates_stale = True
        try:
            latest_rate = ExchangeRate.objects.latest('last_updated')
            if latest_rate.last_updated > last_update_threshold:
                rates_stale = False
        except ExchangeRate.DoesNotExist:
            rates_stale = True # No rates exist, so they are definitely stale

        if rates_stale:
            # Trigger the update_rates management command in a non-blocking way
            # Use sys.executable to ensure the correct python interpreter is used
            # Use the absolute path to manage.py
            manage_py_path = os.path.join(os.getcwd(), 'backend', 'manage.py')
            subprocess.Popen([
                sys.executable, # Use sys.executable to ensure the correct python interpreter is used
                manage_py_path,
                'update_rates'
            ])
            print("Triggered update_rates command in background.") # For logging/debugging

        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializerWithToken

from rest_framework.views import APIView

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        user = request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
