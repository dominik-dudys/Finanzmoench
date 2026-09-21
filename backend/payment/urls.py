from django.urls import path
from . import views

urlpatterns = [
    path('api/create-checkout-session/', views.create_checkout_session, name='create_checkout_session'),
    path('api/webhook/', views.stripe_webhook, name='stripe_webhook'),
]