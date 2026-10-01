from django.contrib import admin
from django.db.models import Count
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display
from core.admin_utils import csv_response

from accounts.models import Person
from .models import Household, PositionCategory


class MemberInline(TabularInline):
    model = Person
    fields = ["email", "first_name", "last_name"]
    readonly_fields = ["email", "first_name", "last_name"]
    extra = 0
    can_delete = False
    show_change_link = True
    verbose_name = "Mitglied"
    verbose_name_plural = "Mitglieder"

    def has_add_permission(self, request, obj=None):
        return False  # Mitglieder treten über die App bei, nicht im Admin


class CategoryInline(TabularInline):
    model = PositionCategory
    fields = ["name", "color_code"]
    extra = 0


@admin.register(Household)
class HouseholdAdmin(ModelAdmin):
    list_display = ["name", "city", "postal_code", "currency", "member_count", "category_count"]
    list_filter = ["currency", "city"]
    search_fields = ["name", "city", "postal_code"]
    readonly_fields = ["household_id"]
    inlines = [MemberInline, CategoryInline]
    actions = ["export_csv"]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _members=Count("person", distinct=True),
            _categories=Count("position_categories", distinct=True),
        )

    @display(description="Mitglieder", ordering="_members")
    def member_count(self, obj):
        return obj._members

    @display(description="Kategorien", ordering="_categories")
    def category_count(self, obj):
        return obj._categories

    @admin.action(description="Als CSV exportieren")
    def export_csv(self, request, queryset):
        header = ["Name", "Ort", "PLZ", "Währung", "Mitglieder", "Kategorien"]
        rows = [
            [h.name, h.city, h.postal_code, h.currency, h._members, h._categories]
            for h in queryset
        ]
        return csv_response("haushalte", header, rows)

@admin.register(PositionCategory)
class PositionCategoryAdmin(ModelAdmin):
    list_display = ["name", "household", "color_code"]
    list_filter = ["household"]
    search_fields = ["name", "household__name"]
    autocomplete_fields = ["household"]