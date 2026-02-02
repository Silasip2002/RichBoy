from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from transactions.models import CURRENCY_CHOICES # Import CURRENCY_CHOICES

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    preferred_currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD') # Add this line
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)

    # Additional profile fields
    display_name = models.CharField(max_length=100, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    gender = models.CharField(
        max_length=20,
        choices=[
            ('Male', 'Male'),
            ('Female', 'Female'),
            ('Prefer not to say', 'Prefer not to say'),
            ('Other', 'Other')
        ],
        blank=True,
        default='Prefer not to say'
    )
    risk_preference = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High')
        ],
        default='low'
    )

    def __str__(self):
        return self.user.username
