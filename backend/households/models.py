import uuid

from django.db import models


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
    household = models.ForeignKey(Household, on_delete=models.CASCADE, related_name='position_categories')
    name = models.CharField(max_length=100)
    color_code = models.CharField(max_length=7, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['household', 'name'], name='unique_household_category_name')
        ]

    def __str__(self):
        return f'{self.household.name}: {self.name}'