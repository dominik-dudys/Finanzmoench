import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Income(models.Model):
    income_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.ForeignKey('accounts.Person', on_delete=models.CASCADE)
    position_category = models.ForeignKey('households.PositionCategory', on_delete=models.SET_NULL, null=True,
                                          blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # typo 'ammount' behoben
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Income: {self.amount} ({self.person.first_name})"


class CostItem(models.Model):
    class IntervalChoices(models.TextChoices):
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'
        YEARLY = 'yearly', 'Yearly'

    cost_item_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    household = models.ForeignKey('households.Household', on_delete=models.CASCADE)
    position_category = models.ForeignKey('households.PositionCategory', on_delete=models.SET_NULL, null=True,
                                          blank=True)

    name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(null=True, blank=True)
    interval = models.CharField(max_length=20, choices=IntervalChoices.choices, default=IntervalChoices.MONTHLY)

    shared_by = models.ManyToManyField('accounts.Person', through='CostShare', related_name='shared_costs')

    def __str__(self):
        return f"{self.name} ({self.amount})"


class CostShare(models.Model):
    cost_item = models.ForeignKey(CostItem, on_delete=models.CASCADE, related_name='shares')
    person = models.ForeignKey('accounts.Person', on_delete=models.CASCADE, related_name='cost_shares')

    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal('0.01')),
            MaxValueValidator(Decimal('100.00'))
        ]
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['cost_item', 'person'], name='unique_cost_item_person_share')
        ]

    def __str__(self):
        return f"{self.person.first_name} trägt {self.percentage}% von {self.cost_item.name}"

    @property
    def calculated_amount(self):
        """Hilfsfunktion: Berechnet den absoluten Geldbetrag für diese Person."""
        return (self.cost_item.amount * self.percentage) / Decimal('100.0')