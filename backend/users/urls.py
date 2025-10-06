from django.urls import path
from .views import MyTokenObtainPairView, RegisterView, UserProfileView, ProfilePictureUploadView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile-picture/', ProfilePictureUploadView.as_view(), name='profile_picture_upload'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
