from collections import Counter
from datetime import datetime, time, timedelta
import json

from django.contrib.admin.models import LogEntry
from django.db.models import Q
from django.utils import timezone
from allauth.mfa.models import Authenticator

from accounts.models import Person
from finances.models import CostItem
from households.models import Household


def _percent(part, total):
    return round(part / total * 100) if total else 0


def _registrations_last_8_weeks():
    today = timezone.localdate()
    monday = today - timedelta(days=today.weekday())
    since = monday - timedelta(weeks=7)
    since_dt = timezone.make_aware(datetime.combine(since, time.min))

    created = Person.objects.filter(created_at__gte=since_dt).values_list("created_at", flat=True)
    buckets = Counter((timezone.localtime(c).date() - since).days // 7 for c in created)

    labels = [(since + timedelta(weeks=i)).strftime("%d.%m.") for i in range(8)]
    data = [buckets.get(i, 0) for i in range(8)]
    return json.dumps({
        "labels": labels,
        "datasets": [{"label": "Neue Nutzer", "data": data}],
    })


def dashboard_callback(request, context):
    now = timezone.now()
    today = timezone.localdate()
    week_ago = now - timedelta(days=7)

    users_total = Person.objects.count()
    users_new = Person.objects.filter(created_at__gte=week_ago).count()
    users_blocked = Person.objects.filter(is_active=False).count()

    households = Household.objects.count()
    members_in_households = Person.objects.filter(household__isnull=False).count()
    avg_members = f"{members_in_households / households:.1f}".replace(".", ",") if households else "0"

    active_contracts = CostItem.objects.filter(
        Q(valid_until__isnull=True) | Q(valid_until__gte=today)
    ).count()

    admin_changes = LogEntry.objects.filter(action_time__gte=week_ago).count()

    users_2fa = (
        Authenticator.objects.filter(type=Authenticator.Type.TOTP)
        .values("user").distinct().count()
    )
    users_consent = Person.objects.filter(ai_consent_at__isnull=False).count()

    context.update({
        "kpis_top": [
            {"title": "Nutzer", "value": users_total, "footer": f"+{users_new} in den letzten 7 Tagen"},
            {"title": "Haushalte", "value": households, "footer": f"Ø {avg_members} Mitglieder"},
            {"title": "Aktive Verträge", "value": active_contracts, "footer": "über alle Haushalte"},
        ],
        "kpis_bottom": [
            {"title": "Gesperrte Nutzer", "value": users_blocked, "footer": "is_active = aus"},
            {"title": "Admin-Änderungen", "value": admin_changes, "footer": "letzte 7 Tage (Audit-Log)"},
        ],
        "quotes": [
            {"title": "2FA aktiv", "value": _percent(users_2fa, users_total),
             "description": f"{users_2fa} von {users_total} Nutzern"},
            {"title": "KI-Einwilligung", "value": _percent(users_consent, users_total),
             "description": f"{users_consent} von {users_total} Nutzern"},
        ],
        "registrations_chart": _registrations_last_8_weeks(),
    })
    return context