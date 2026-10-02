from django.db import models

# Create your models here.
import uuid

from django.conf import settings
from django.utils import timezone


class Subscription(models.Model):
    ACTIVE_STATUSES = {"active", "trialing"}
    PLAN_FREE = "free"
    PLAN_PREMIUM = "premium"

    subscription_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscription')
    stripe_customer_id = models.CharField(max_length=255, unique=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=30, blank=True, help_text="Stripe-Status, z. B. active, canceled, past_due")
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_active(self) -> bool:
        if self.status not in self.ACTIVE_STATUSES:
            return False
        return self.current_period_end is None or self.current_period_end > timezone.now()

    @property
    def plan(self) -> str:
        return self.PLAN_PREMIUM if self.is_active else self.PLAN_FREE

    def __str__(self):
        return f'{self.person} – {self.status or "kein Abo"}'