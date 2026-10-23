import hashlib

from .models import FeatureFlag


def _bucket(flag_name: str, user_id) -> int:
    """Stabile Zahl 0–99 pro (Flag, User). Gleicher Input → immer gleiche Zahl."""
    # Deterministisches Hashing: Stellt sicher, dass ein Nutzer bei einem prozentualen Rollout
    # (z.B. 30%) dauerhaft in derselben Gruppe bleibt, ohne dass diese Zuweisung in der Datenbank
    # gespeichert werden muss. Verhindert "Flackern" von Features bei Seiten-Reloads.
    digest = hashlib.sha256(f"{flag_name}:{user_id}".encode()).hexdigest()
    return int(digest[:8], 16) % 100


def _evaluate(flag: FeatureFlag, user, allowlisted_ids: set) -> bool:
    if not flag.enabled:
        # Globaler Kill-Switch: Wenn deaktiviert, ist das Feature für ausnahmslos alle Nutzer aus.
        return False
    if not user.is_authenticated:
        # Ohne Login: Unbekannte Nutzer erhalten nur voll ausgerollte Features (100%),
        # da prozentuales Bucketing ohne User-ID nicht stabil möglich ist.
        return flag.rollout_percent >= 100
    if flag.pk in allowlisted_ids:
        # Explizite Freischaltung (Allowlist) überstimmt den prozentualen Rollout.
        return True
    return _bucket(flag.name, user.pk) < flag.rollout_percent


def get_flags_for_user(user) -> dict[str, bool]:
    """Alle Flags auf einmal auswerten (2 Queries, egal wie viele Flags)."""
    # Performance-Optimierung (N+1 Problem vermieden):
    # Lädt alle IDs der direkt zugewiesenen Flags des Nutzers auf einmal in ein Set (O(1) Lookup).
    allowlisted_ids = (
        set(user.feature_flags.values_list("pk", flat=True))
        if user.is_authenticated else set()
    )
    return {
        flag.name: _evaluate(flag, user, allowlisted_ids)
        for flag in FeatureFlag.objects.all()
    }


def is_flag_active(name: str, user) -> bool:
    """Einzelnen Flag prüfen – fürs Backend. Unbekannter Flag = aus."""
    try:
        flag = FeatureFlag.objects.get(name=name)
    except FeatureFlag.DoesNotExist:
        # Fail-Safe (Graceful Degradation): Wenn der Code nach einem Flag fragt, der in der Datenbank
        # (noch) nicht existiert, stürzt das Backend nicht ab, sondern lässt das Feature sicherheitshalber deaktiviert.
        return False
    allowlisted_ids = (
        set(user.feature_flags.filter(pk=flag.pk).values_list("pk", flat=True))
        if user.is_authenticated else set()
    )
    return _evaluate(flag, user, allowlisted_ids)