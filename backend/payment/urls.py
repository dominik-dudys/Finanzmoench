from django.urls import path

from .views import CheckoutView, PortalView, SubscriptionStatusView, stripe_webhook

urlpatterns = [
    path('status/', SubscriptionStatusView.as_view(), name='payment-status'),
    path('checkout/', CheckoutView.as_view(), name='payment-checkout'),
    path('portal/', PortalView.as_view(), name='payment-portal'),
    path('webhook/', stripe_webhook, name='payment-webhook'),
]