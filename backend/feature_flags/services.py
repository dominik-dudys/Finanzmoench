import hashlib

from .models import FeatureFlag


def _bucket(flag_name: str, user_id) -> int:
    """Stabile Zahl 0–99 pro (Flag, User). Gleicher Input → immer gleiche Zahl."""
    digest = hashlib.sha256(f"{flag_name}:{user_id}".encode()).hexdigest()
    return int(digest[:8], 16) % 100


def _evaluate(flag: FeatureFlag, user, allowlisted_ids: set) -> bool:
    if not flag.enabled:
        return False
    if not user.is_authenticated:
        # Ohne Login: nur voll ausgerollte Flags
        return flag.rollout_percent >= 100
    if flag.pk in allowlisted_ids:
        return True
    return _bucket(flag.name, user.pk) < flag.rollout_percent


def get_flags_for_user(user) -> dict[str, bool]:
    """Alle Flags auf einmal auswerten (2 Queries, egal wie viele Flags)."""
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
        return False
    allowlisted_ids = (
        set(user.feature_flags.filter(pk=flag.pk).values_list("pk", flat=True))
        if user.is_authenticated else set()
    )
    return _evaluate(flag, user, allowlisted_ids)