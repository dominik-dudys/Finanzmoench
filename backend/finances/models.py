import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Income(models.Model):
    income_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    history_group_id = models.UUIDField(default=uuid.uuid4, editable=True,
                                        help_text="Gruppiert historische Versionen desselben Einkommens")

    person = models.ForeignKey('accounts.Person', on_delete=models.CASCADE)
    position_category = models.ForeignKey('households.PositionCategory', on_delete=models.SET_NULL, null=True,
                                          blank=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    valid_from = models.DateField()
    valid_until = models.DateField(null=True, blank=True)

    def __str__(self):
        status = "Aktiv" if not self.valid_until else f"Bis {self.valid_until}"
        return f"Income: {self.amount} ({self.person.first_name}) | {status}"


class CostItem(models.Model):
    class IntervalChoices(models.TextChoices):
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'
        YEARLY = 'yearly', 'Yearly'

    cost_item_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    history_group_id = models.UUIDField(default=uuid.uuid4, editable=True,
                                        help_text="Gruppiert historische Versionen derselben Ausgabe")

    household = models.ForeignKey('households.Household', on_delete=models.CASCADE)
    position_category = models.ForeignKey('households.PositionCategory', on_delete=models.SET_NULL, null=True,
                                          blank=True)

    name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(null=True, blank=True)
    interval = models.CharField(max_length=20, choices=IntervalChoices.choices, default=IntervalChoices.MONTHLY)

    valid_from = models.DateField()
    valid_until = models.DateField(null=True, blank=True)

    shared_by = models.ManyToManyField('accounts.Person', through='CostShare', related_name='shared_costs')

    def __str__(self):
        status = "Aktiv" if not self.valid_until else f"Bis {self.valid_until}"
        return f"{self.name} ({self.amount} | {status})"


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
        """Berechnet den absoluten Geldbetrag für diese Person in dieser Version."""
        return (self.cost_item.amount * self.percentage) / Decimal('100.0')