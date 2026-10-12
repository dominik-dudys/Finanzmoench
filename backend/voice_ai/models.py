from django.conf import settings
from django.db import models


class AiUsage(models.Model):
    """Zählt erfolgreiche Jeremy-Antworten pro Person und Tag (Kalendertag in Europe/Berlin)."""

    person = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_usages")
    date = models.DateField()
    count = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["person", "date"], name="unique_ai_usage_per_day"),
        ]

    def __str__(self):
        return f"{self.person} – {self.date}: {self.count}"