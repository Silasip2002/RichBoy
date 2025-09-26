from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from transactions.models import CURRENCY_CHOICES # Import CURRENCY_CHOICES

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    preferred_currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD') # Add this line

    def __str__(self):
        return self.user.username
