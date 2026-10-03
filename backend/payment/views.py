import json
import logging

import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Subscription
from .services import create_checkout_url, create_portal_url, is_premium, sync_subscription

logger = logging.getLogger(__name__)


class SubscriptionStatusView(APIView):
    def get(self, request):
        sub = Subscription.objects.filter(person=request.user).first()
        return Response({
            "plan": sub.plan if sub else Subscription.PLAN_FREE,
            "is_premium": bool(sub and sub.is_active),
            "status": sub.status if sub else None,
            "current_period_end": sub.current_period_end if sub else None,
            "cancel_at_period_end": sub.cancel_at_period_end if sub else False,
        })


class CheckoutView(APIView):
    def post(self, request):
        if is_premium(request.user):
            return Response({"code": "already_premium"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            return Response({"url": create_checkout_url(request.user)})
        except stripe.StripeError:
            logger.exception("Stripe-Checkout fehlgeschlagen")
            return Response({"code": "payment_provider_error"}, status=status.HTTP_502_BAD_GATEWAY)


class PortalView(APIView):
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


@csrf_exempt
@require_POST
def stripe_webhook(request):
    try:
        stripe.Webhook.construct_event(
            request.body,
            request.headers.get("Stripe-Signature", ""),
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.SignatureVerificationError):
        logger.warning("Ungültiger Stripe-Webhook abgelehnt")
        return HttpResponse(status=400)

    event = json.loads(request.body)
    if event["type"] in SUBSCRIPTION_EVENTS:
        sync_subscription(event["data"]["object"])
    return HttpResponse(status=200)