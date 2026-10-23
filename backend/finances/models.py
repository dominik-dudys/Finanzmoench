import calendar
import uuid
from datetime import date, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Income(models.Model):
    income_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    history_group_id = models.UUIDField(
        default=uuid.uuid4,
        editable=True,
        help_text="Gruppiert historische Versionen desselben Einkommens",
    )

    person = models.ForeignKey('accounts.Person', on_delete=models.CASCADE)
    position_category = models.ForeignKey(
        'households.PositionCategory',
        on_delete=models.PROTECT,
    )

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
    history_group_id = models.UUIDField(
        default=uuid.uuid4,
        editable=True,
        help_text="Gruppiert historische Versionen derselben Ausgabe",
    )

    household = models.ForeignKey('households.Household', on_delete=models.CASCADE)
    position_category = models.ForeignKey(
        'households.PositionCategory',
        on_delete=models.PROTECT,
    )

    name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(null=True, blank=True)
    interval = models.CharField(
        max_length=20,
        choices=IntervalChoices.choices,
        default=IntervalChoices.MONTHLY,
    )
    #valid tells since when this Version is valid, start/end tells the duration of the payment
    valid_from = models.DateField()
    valid_until = models.DateField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    shared_by = models.ManyToManyField('accounts.Person', through='CostShare', related_name='shared_costs')

    class Meta:
        constraints = [
            models.CheckConstraint(condition=~models.Q(end_date__lt=models.F('start_date')), name='costitem_valid_date_range')
        ]

    def clean(self):
        super().clean()
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValidationError('end_date darf nicht vor start_date liegen.')

    def next_payment_date(self, base_date=None):
        if not self.start_date:
            return None

        current_date = base_date or date.today()

        if self.end_date and current_date > self.end_date:
            return None

        def day_in_month(year, month):
            last_day = calendar.monthrange(year, month)[1]
            return date(year, month, min(self.start_date.day, last_day))

        if current_date < self.start_date:
            candidate = self.start_date
        elif self.interval == self.IntervalChoices.DAILY:
            candidate = current_date + timedelta(days=1)
        elif self.interval == self.IntervalChoices.WEEKLY:
            days_since_start = (current_date - self.start_date).days
            candidate = current_date + timedelta(days=7 - days_since_start % 7)
        elif self.interval == self.IntervalChoices.MONTHLY:
            candidate = day_in_month(current_date.year, current_date.month)
            if candidate <= current_date:
                next_year = current_date.year + (current_date.month == 12)
                next_month = current_date.month % 12 + 1
                candidate = day_in_month(next_year, next_month)
        elif self.interval == self.IntervalChoices.YEARLY:
            candidate = day_in_month(current_date.year, self.start_date.month)
            if candidate <= current_date:
                candidate = day_in_month(current_date.year + 1, self.start_date.month)
        else:
            return None

        if self.end_date and candidate > self.end_date:
            return None
        return candidate

    @property
    def current_amount(self):
        today = date.today()
        active_entry = CostItem.objects.filter(
            history_group_id=self.history_group_id,
            valid_from__lte=today
        ).filter(
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=today)
        ).order_by(
            '-valid_from',
            models.F('valid_until').desc(nulls_first=True)
        ).first()

        if active_entry:
            return active_entry.amount
        return self.amount

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
        return (self.cost_item.current_amount * self.percentage) / Decimal('100.0')