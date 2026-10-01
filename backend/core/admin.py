from django.contrib import admin
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import RangeDateFilter
from unfold.decorators import display

ACTION_LABELS = {ADDITION: "Angelegt", CHANGE: "Geändert", DELETION: "Gelöscht"}


@admin.register(LogEntry)
class AuditLogAdmin(ModelAdmin):
    """Alle Änderungen im Admin – nur lesend (Rechenschaftspflicht, Art. 5 Abs. 2 DSGVO)."""
    list_display = ["action_time", "user", "action", "content_type", "object_repr", "details"]
    list_filter = ["action_flag", "content_type", ("action_time", RangeDateFilter)]
    list_filter_submit = True
    search_fields = ["object_repr", "change_message", "user__email"]
    date_hierarchy = "action_time"
    ordering = ["-action_time"]

    @display(description="Aktion")
    def action(self, obj):
        return ACTION_LABELS.get(obj.action_flag, obj.action_flag)

    @display(description="Details")
    def details(self, obj):
        return obj.get_change_message() or "–"

    # Log darf niemand verändern oder löschen
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False