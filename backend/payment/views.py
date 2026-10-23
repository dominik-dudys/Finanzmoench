import json
import logging

import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Subscription
from .services import create_checkout_url, create_portal_url, is_premium, sync_subscription

logger = logging.getLogger(__name__)


class SubscriptionStatusView(APIView):
    @extend_schema(summary="Zeigt den aktuellen Abostatus an.")
    def get(self, request):
        # Liest den Status nur aus der lokalen Datenbank aus (kein langsamer Stripe-API-Call nötig)
        sub = Subscription.objects.filter(person=request.user).first()
        return Response({
            "plan": sub.plan if sub else Subscription.PLAN_FREE,
            "is_premium": bool(sub and sub.is_active),
            "status": sub.status if sub else None,
            "current_period_end": sub.current_period_end if sub else None,
            "cancel_at_period_end": sub.cancel_at_period_end if sub else False,
        })


class CheckoutView(APIView):
    @extend_schema(summary="Leitet die Zahlung ein.")
    def post(self, request):
        # Schutzmaßnahme: Verhindert versehentliche Doppelbuchungen für bereits aktive Premium-Nutzer
        if is_premium(request.user):
            return Response({"code": "already_premium"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            return Response({"url": create_checkout_url(request.user)})
        except stripe.StripeError:
            # Fallback bei Stripe-Downtimes: Backend stürzt nicht ab, sondern gibt sauberen 502 an das Frontend
            logger.exception("Stripe-Checkout fehlgeschlagen")
            return Response({"code": "payment_provider_error"}, status=status.HTTP_502_BAD_GATEWAY)


class PortalView(APIView):
    @extend_schema(summary="Erstellt eine Session bei stripe, gibt die URL davon zurück und leitet daran weiter.")
    def post(self, request):
        if not Subscription.objects.filter(person=request.user).exists():
            return Response({"code": "no_subscription"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            return Response({"url": create_portal_url(request.user)})
        except stripe.StripeError:
            logger.exception("Stripe-Portal fehlgeschlagen")
            return Response({"code": "payment_provider_error"}, status=status.HTTP_502_BAD_GATEWAY)


SUBSCRIPTION_EVENTS = {
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
}

# @csrf_exempt ist hier zwingend erforderlich, da Stripe bei Webhook-Aufrufen kein lokales Django-CSRF-Token kennen kann.
@csrf_exempt
@require_POST
def stripe_webhook(request):
    try:
        # Kritischer Sicherheits-Check: Verifiziert die kryptografische Signatur des Headers.
        # Verhindert, dass unbefugte Dritte manipulierte Zahlungs-Erfolgsmeldungen an den Webhook senden.
        stripe.Webhook.construct_event(
            request.body,
            request.headers.get("Stripe-Signature", ""),
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.SignatureVerificationError):
        logger.warning("Ungültiger Stripe-Webhook abgelehnt")
        return HttpResponse(status=400)

    event = json.loads(request.body)

    # Filtern irrelevanter Events, um unnötige Datenbank-Operationen zu vermeiden
    if event["type"] in SUBSCRIPTION_EVENTS:
        sync_subscription(event["data"]["object"])

    # Stripe erwartet immer einen schnellen 20x Statuscode, andernfalls wird das Event später erneut gesendet (Retries)
    return HttpResponse(status=200)