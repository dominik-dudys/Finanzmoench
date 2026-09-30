from django.contrib import admin

from .models import FeatureFlag


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ['name', 'enabled', 'rollout_percent', 'updated_at']
    list_editable = ['enabled', 'rollout_percent']
    search_fields = ['name', 'description']
    filter_horizontal = ['users']