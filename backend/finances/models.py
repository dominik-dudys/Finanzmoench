import uuid
from django.db import models

# Create your models here.
class CostItem(models.Model):
    class IntervalChoices(models.TextChoices):
        DAILY= 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'
        YEARLY = 'yearly', 'Yearly'
    cost_item_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    household = models.ForeignKey('households.Household', on_delete=models.CASCADE)
    position_category = models.ForeignKey('households.PositionCategory', on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    interval = models.CharField(max_length=20, choices=IntervalChoices.choices)

class ItemEntry(models.Model):
    item_entry_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cost_item = models.ForeignKey(CostItem, on_delete=models.CASCADE)
    ammount = models.DecimalField(max_digits=10, decimal_places=2)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField(null=True, blank=True) # can be null bc maybe is still valid
    note = models.TextField(null=True, blank=True)

class Income(models.Model):
    income_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.ForeignKey('accounts.Person', on_delete=models.CASCADE)
    position_category = models.ForeignKey('households.PositionCategory', on_delete=models.SET_NULL, null=True, blank=True)
    ammount = models.DecimalField(max_digits=10, decimal_places=2)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField(null=True, blank=True)

class Transaction(models.Model):
    transaction_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.ForeignKey('accounts.Person', on_delete=models.CASCADE)
    position_category = models.ForeignKey('households.PositionCategory', on_delete=models.SET_NULL, null=True, blank=True)
    ammount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    note = models.TextField(null=True, blank=True)