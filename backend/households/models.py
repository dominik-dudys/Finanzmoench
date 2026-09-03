import uuid
from django.db import models
# Create your models here.

class Household(models.Model):
    household_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    currency = models.CharField(max_length=3)

    def __str__(self):
        return self.name

class PositionCategory(models.Model):
    position_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    color_code = models.CharField(max_length=7, null=True, blank=True)

    def __str__(self):
        return self.name