from django.contrib import admin, messages
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.models import Group
from django.db.models import Exists, OuterRef
from allauth.mfa.models import Authenticator
from unfold.admin import ModelAdmin
from unfold.decorators import display

from core.admin_utils import csv_response
from .models import Person

admin.site.unregister(Group)


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass


@admin.register(Person)
class PersonAdmin(ModelAdmin):
    list_display = [
        "email", "first_name", "last_name", "household",
        "login_methods", "two_factor", "ai_consent",
        "is_active", "is_staff", "created_at", "last_login",
    ]
    list_filter = ["is_active", "is_staff", "jeremy_mode"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["-created_at"]
    readonly_fields = ["person_id", "created_at", "last_login", "ai_consent_at"]
    autocomplete_fields = ["household"]
    actions = ["deactivate_users", "activate_users", "export_csv"]

    fieldsets = [
        ("Person", {"fields": ["person_id", "email", "first_name", "last_name", "household"]}),
        ("JeremyAI", {"fields": ["ai_consent_at", "jeremy_mode"]}),
        ("Status & Rechte", {"fields": ["is_active", "is_staff", "is_superuser", "groups", "user_permissions"]}),
        ("Zeitstempel", {"fields": ["created_at", "last_login"]}),
    ]
    filter_horizontal = ["groups", "user_permissions"]

    def get_queryset(self, request):
        return (
            super().get_queryset(request)
            .select_related("household")
            .prefetch_related("socialaccount_set")
            .annotate(has_2fa=Exists(
                Authenticator.objects.filter(user=OuterRef("pk"), type=Authenticator.Type.TOTP)
            ))
        )

    # ---------- Spalten ----------

    @display(description="Login")
    def login_methods(self, obj):
        methods = [sa.provider for sa in obj.socialaccount_set.all()]
        if obj.has_usable_password():
            methods.insert(0, "password")
        return ", ".join(methods) or "–"

    @display(description="2FA", boolean=True)
    def two_factor(self, obj):
        return obj.has_2fa

    @display(description="KI-Einwilligung", boolean=True)
    def ai_consent(self, obj):
        return obj.ai_consent_at is not None

    # ---------- Aktionen ----------

    def _set_active(self, request, queryset, active: bool):
        # Sich selbst und Superuser nie sperren
        targets = queryset.exclude(pk=request.user.pk)
        if not active:
            targets = targets.exclude(is_superuser=True)
        changed = 0
        for person in targets.filter(is_active=not active):
            person.is_active = active
            person.save(update_fields=["is_active"])
            self.log_change(request, person, "Entsperrt" if active else "Gesperrt")  # → Audit-Log
            changed += 1
        skipped = queryset.count() - changed
        verb = "entsperrt" if active else "gesperrt"
        self.message_user(request, f"{changed} Nutzer {verb}.", messages.SUCCESS)
        if skipped:
            self.message_user(
                request,
                f"{skipped} übersprungen (bereits {verb}, du selbst oder Superuser).",
                messages.WARNING,
            )

    @admin.action(description="Ausgewählte Nutzer sperren")
    def deactivate_users(self, request, queryset):
        self._set_active(request, queryset, active=False)

    @admin.action(description="Ausgewählte Nutzer entsperren")
    def activate_users(self, request, queryset):
        self._set_active(request, queryset, active=True)

    @admin.action(description="Als CSV exportieren")
    def export_csv(self, request, queryset):
        header = ["E-Mail", "Vorname", "Nachname", "Haushalt", "Login", "2FA",
                  "KI-Einwilligung", "Aktiv", "Registriert am"]
        rows = [
            [
                p.email, p.first_name, p.last_name,
                p.household.name if p.household else "",
                self.login_methods(p),
                "ja" if p.has_2fa else "nein",
                "ja" if p.ai_consent_at else "nein",
                "ja" if p.is_active else "nein",
                p.created_at.strftime("%d.%m.%Y"),
            ]
            for p in queryset
        ]
        return csv_response("nutzer", header, rows)