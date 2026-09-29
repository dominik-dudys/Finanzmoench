import uuid

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


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
    is_standard = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['household', 'name'], name='unique_household_category_name')
        ]

    def __str__(self):
        return f'{self.household.name}: {self.name}'


@receiver(post_save, sender='households.Household')
def create_standard_categories(sender, instance, created, **kwargs):
    if created:
        standard_categories = [
            {"name": "Gehalt", "color_code": "#4CAF50"},
            {"name": "Kindergeld", "color_code": "#8BC34A"},
            {"name": "Miete & Nebenkosten", "color_code": "#F44336"},
            {"name": "Lebensmittel", "color_code": "#FF9800"},
            {"name": "Mobilität (Auto/ÖPNV)", "color_code": "#2196F3"},
            {"name": "Versicherungen", "color_code": "#9C27B0"},
            {"name": "Freizeit & Abos", "color_code": "#E91E63"},
        ]

        PositionCategory.objects.bulk_create([
            PositionCategory(
                household=instance,
                name=cat["name"],
                color_code=cat["color_code"],
                is_standard=True
            )
            for cat in standard_categories
        ])