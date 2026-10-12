import uuid
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


class AiChatSession(models.Model):
    """Gruppiert Nachrichten zu einem Chat-Verlauf."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_chat_sessions")
    title = models.CharField(max_length=255, default="Neuer Chat")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat {self.title} ({self.person})"


class AiChatMessage(models.Model):
    """Speichert die einzelnen Nachrichten (User & Jeremy)."""
    ROLE_CHOICES = (
        ('user', 'User'),
        ('model', 'Model'),
    )
    session = models.ForeignKey(AiChatSession, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role} um {self.created_at}"