from django.contrib.auth.models import User
from .models import UserProfile
from .serializers import UserSerializerWithToken, UserProfileSerializer, UserSerializerForToken
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.contrib.auth import authenticate
import os

import subprocess # Import subprocess
from datetime import datetime, timedelta # Import datetime and timedelta
from django.utils import timezone # Import timezone
from assets.models import ExchangeRate # Import ExchangeRate model
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

        # If no display_name is set, use the username as default
        if not profile.display_name:
            profile.display_name = user.username
            profile.save()

        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        user = request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfilePictureUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        try:
            # Get the user's profile
            profile, created = UserProfile.objects.get_or_create(user=request.user)

            # Check if a file was uploaded
            if 'profile_picture' not in request.FILES:
                return Response(
                    {'error': 'No profile picture file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            file = request.FILES['profile_picture']

            # Validate file type
            if not file.content_type.startswith('image/'):
                return Response(
                    {'error': 'File must be an image'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate file size (5MB max)
            if file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'File size must be less than 5MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Delete old profile picture if it exists
            if profile.profile_picture:
                # Delete the old file from storage
                if os.path.isfile(profile.profile_picture.path):
                    os.remove(profile.profile_picture.path)

            # Save the new profile picture
            profile.profile_picture = file
            profile.save()

            # Return the updated profile data
            serializer = UserProfileSerializer(profile, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to upload profile picture: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, *args, **kwargs):
        try:
            # Get the user's profile
            profile, created = UserProfile.objects.get_or_create(user=request.user)

            if not profile.profile_picture:
                return Response(
                    {'error': 'No profile picture to delete'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Delete the file from storage
            if os.path.isfile(profile.profile_picture.path):
                os.remove(profile.profile_picture.path)

            # Remove the reference from the database
            profile.profile_picture = None
            profile.save()

            # Return the updated profile data
            serializer = UserProfileSerializer(profile, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to delete profile picture: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            user = request.user
            current_password = request.data.get('current_password')
            new_password = request.data.get('new_password')

            # Validate input
            if not current_password or not new_password:
                return Response(
                    {'error': 'Current password and new password are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify current password
            if not user.check_password(current_password):
                return Response(
                    {'error': 'Current password is incorrect'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate new password strength
            password_errors = []
            if len(new_password) < 8:
                password_errors.append('Password must be at least 8 characters long')
            if not any(c.isupper() for c in new_password):
                password_errors.append('Password must contain at least one uppercase letter')
            if not any(c.islower() for c in new_password):
                password_errors.append('Password must contain at least one lowercase letter')
            if not any(c.isdigit() for c in new_password):
                password_errors.append('Password must contain at least one number')
            if not any(c in '!@#$%^&*(),.?":{}|<>' for c in new_password):
                password_errors.append('Password must contain at least one special character')

            if password_errors:
                return Response(
                    {'error': '; '.join(password_errors)},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if new password is same as current password
            if user.check_password(new_password):
                return Response(
                    {'error': 'New password must be different from current password'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Change password
            user.set_password(new_password)
            user.save()

            return Response(
                {'message': 'Password changed successfully'},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {'error': f'Failed to change password: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
