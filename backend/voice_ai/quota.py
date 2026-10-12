from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.db.models import F
from django.utils import timezone

from payment.services import is_premium

from .models import AiUsage

BERLIN = ZoneInfo("Europe/Berlin")
DAILY_LIMITS = {"free": 2, "premium": 10}


def get_plan(user) -> str:
    """Einzige Stelle, die über Free/Premium entscheidet."""
    return "premium" if is_premium(user) else "free"


def _today():
    return timezone.now().astimezone(BERLIN).date()


def _next_reset() -> datetime:
    return datetime.combine(_today() + timedelta(days=1), time.min, tzinfo=BERLIN)


def get_usage(user) -> dict:
    plan = get_plan(user)
    limit = DAILY_LIMITS[plan]
    used = (
               AiUsage.objects.filter(person=user, date=_today())
               .values_list("count", flat=True)
               .first()
           ) or 0
    return {
        "plan": plan,
        "limit": limit,
        "used": used,
        "remaining": max(limit - used, 0),
        "resets_at": _next_reset().isoformat(),
    }


def record_usage(user) -> None:
    """Eine erfolgreiche Anfrage zählen (atomar per F-Ausdruck)."""
    usage, _ = AiUsage.objects.get_or_create(person=user, date=_today())
    AiUsage.objects.filter(pk=usage.pk).update(count=F("count") + 1)