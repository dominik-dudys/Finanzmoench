import logging
from datetime import datetime, timezone as dt_timezone

import stripe
from django.conf import settings

from .models import Subscription

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


def is_premium(user) -> bool:
    """Prüft, ob der Nutzer ein aktives Premium-Abo besitzt."""
    if not user.is_authenticated:
        return False
    sub = Subscription.objects.filter(person=user).first()
    return bool(sub and sub.is_active)


def _get_or_create_customer(person) -> Subscription:
    """Idempotentes Abrufen oder Erstellen eines Stripe-Kunden."""
    sub = Subscription.objects.filter(person=person).first()
    if sub:
        return sub

    # Wenn noch kein lokaler Datensatz existiert, wird ein neuer Stripe-Customer angelegt.
    # Die person_id wird in den Metadaten hinterlegt, um Zahlungen später sicher zuordnen zu können.
    customer = stripe.Customer.create(
        email=person.email,
        name=str(person),
        metadata={"person_id": str(person.person_id)},
    )
    return Subscription.objects.create(person=person, stripe_customer_id=customer.id)


def create_checkout_url(person) -> str:
    """Generiert eine sichere, temporäre Stripe-Checkout-URL für den Abo-Abschluss."""
    sub = _get_or_create_customer(person)
    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=sub.stripe_customer_id,
        line_items=[{"price": settings.STRIPE_PRICE_ID_PREMIUM, "quantity": 1}],
        client_reference_id=str(person.person_id),
        # Dynamische Return-URLs basierend auf der Frontend-Umgebung (Dev vs. Prod)
        success_url=f"{settings.FRONTEND_URL}/einstellungen?checkout=success#premium",
        cancel_url=f"{settings.FRONTEND_URL}/einstellungen?checkout=cancel#premium",
        locale="de",
    )
    return session.url


def create_portal_url(person) -> str:
    """Generiert einen Link zum Stripe-Self-Service-Portal (für Kündigungen/Rechnungen)."""
    sub = Subscription.objects.get(person=person)
    session = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/einstellungen#premium",
    )
    return session.url


def _period_end(data: dict):
    """Extrahiert das Enddatum der aktuellen Abrechnungsperiode sicher aus der verschachtelten Stripe-JSON-Response."""
    ts = data.get("current_period_end")
    if ts is None:
        items = data.get("items", {}).get("data", [])
        ts = items[0].get("current_period_end") if items else None
    return datetime.fromtimestamp(ts, tz=dt_timezone.utc) if ts else None


def sync_subscription(data: dict) -> None:
    """
    Synchronisiert den lokalen Datenbank-Status mit den Webhook-Daten von Stripe.
    Stripe gilt hier als 'Source of Truth'.
    """
    sub = Subscription.objects.filter(stripe_customer_id=data["customer"]).first()
    if sub is None:
        logger.warning("Webhook für unbekannten Stripe-Customer %s", data["customer"])
        return
    sub.stripe_subscription_id = data["id"]
    sub.status = data["status"]
    sub.current_period_end = _period_end(data)
    # Wichtig für die Frontend-Anzeige: Abo ist aktiv, aber läuft zum Ende der Periode aus
    sub.cancel_at_period_end = data.get("cancel_at_period_end", False)
    sub.save()
    logger.info("Abo %s von %s → %s", data["id"], sub.person.email, data["status"])