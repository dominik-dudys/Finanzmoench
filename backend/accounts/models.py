import uuid
from django.db import models

# Create your models here.

class Person(models.Model):
    person_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    household = models.ForeignKey('households.Household', on_delete=models.SET_NULL, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True) # auto_now_add true ist the same as CURRENT_TIMESTAMP in sql
    email = models.EmailField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

class UserAuth(models.Model):
    class Provider(models.TextChoices):
        LOCAL = 'local', 'Local'
        GOOGLE = 'google', 'Google'
        GITHUB = 'github', 'GitHub'
        APPLE = 'apple', 'Apple'

    auth_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    provider = models.CharField(max_length=20, choices=Provider.choices)
    provider_uid = models.CharField(max_length=255, null=True, blank=True)
    password_hash = models.CharField(max_length=255, null=True, blank=True)
    last_login = models.DateTimeField(null=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['provider', 'provider_uid'], name='unique_provider_uid')]