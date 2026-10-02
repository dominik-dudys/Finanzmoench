from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import FeatureFlag


@admin.register(FeatureFlag)
class FeatureFlagAdmin(ModelAdmin):
    list_display = ['name', 'enabled', 'rollout_percent', 'updated_at']
    list_editable = ['enabled', 'rollout_percent']
    search_fields = ['name', 'description']
    filter_horizontal = ['users']