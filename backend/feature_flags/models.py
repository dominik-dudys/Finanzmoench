import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class FeatureFlag(models.Model):
    flag_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.SlugField(max_length=50, unique=True, help_text="Key für Frontend/Backend, z. B. two_factor")
    description = models.CharField(max_length=255, blank=True)

    enabled = models.BooleanField(default=False, help_text="Hauptschalter – aus = für niemanden aktiv")
    rollout_percent = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Anteil der User (0–100), die das Feature sehen",
    )
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='feature_flags',
        help_text="Diese User sehen das Feature immer (wenn enabled)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name