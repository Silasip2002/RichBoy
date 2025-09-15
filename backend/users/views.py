from django.contrib.auth.models import User
from .models import UserProfile
from .serializers import UserSerializerWithToken, UserProfileSerializer, UserSerializerForToken
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        serializer = UserSerializerForToken(self.user).data
        for k, v in serializer.items():
            data[k] = v
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
