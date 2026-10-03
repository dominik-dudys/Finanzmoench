import logging
from datetime import datetime, timezone as dt_timezone

import stripe
from django.conf import settings

from .models import Subscription

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


def is_premium(user) -> bool:
    if not user.is_authenticated:
        return False
    sub = Subscription.objects.filter(person=user).first()
    return bool(sub and sub.is_active)


def _get_or_create_customer(person) -> Subscription:
    sub = Subscription.objects.filter(person=person).first()
    if sub:
        return sub
    customer = stripe.Customer.create(
        email=person.email,
        name=str(person),
        metadata={"person_id": str(person.person_id)},
    )
    return Subscription.objects.create(person=person, stripe_customer_id=customer.id)


def create_checkout_url(person) -> str:
    sub = _get_or_create_customer(person)
    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=sub.stripe_customer_id,
        line_items=[{"price": settings.STRIPE_PRICE_ID_PREMIUM, "quantity": 1}],
        client_reference_id=str(person.person_id),
        success_url=f"{settings.FRONTEND_URL}/einstellungen?checkout=success#premium",
        cancel_url=f"{settings.FRONTEND_URL}/einstellungen?checkout=cancel#premium",
        locale="de",
    )
    return session.url


def create_portal_url(person) -> str:
    sub = Subscription.objects.get(person=person)
    session = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/einstellungen#premium",
    )
    return session.url


def _period_end(data: dict):
    ts = data.get("current_period_end")
    if ts is None:
        items = data.get("items", {}).get("data", [])
        ts = items[0].get("current_period_end") if items else None
    return datetime.fromtimestamp(ts, tz=dt_timezone.utc) if ts else None


def sync_subscription(data: dict) -> None:
    sub = Subscription.objects.filter(stripe_customer_id=data["customer"]).first()
    if sub is None:
        logger.warning("Webhook für unbekannten Stripe-Customer %s", data["customer"])
        return
    sub.stripe_subscription_id = data["id"]
    sub.status = data["status"]
    sub.current_period_end = _period_end(data)
    sub.cancel_at_period_end = data.get("cancel_at_period_end", False)
    sub.save()
    logger.info("Abo %s von %s → %s", data["id"], sub.person.email, data["status"])