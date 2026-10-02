from django.contrib import admin

from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['person', 'status', 'current_period_end', 'cancel_at_period_end', 'updated_at']
    list_filter = ['status', 'cancel_at_period_end']
    search_fields = ['person__email', 'stripe_customer_id', 'stripe_subscription_id']
    readonly_fields = ['subscription_id', 'person', 'stripe_customer_id', 'stripe_subscription_id',
                       'status', 'current_period_end', 'cancel_at_period_end', 'updated_at']