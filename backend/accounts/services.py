from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from accounts.models import Person
from finances.models import CostItem, CostShare
from django.db import transaction


def generate_dsgvo_export_data(user: Person) -> dict:
    """Sammelt alle personenbezogenen Daten eines Nutzers nach Art. 15 & 20 DSGVO."""

    # Basis-Profildaten
    profile_data = {
        "person_id": user.person_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "created_at": user.created_at,
        "last_login": user.last_login,
        "ai_consent_at": user.ai_consent_at,
        "jeremy_mode": user.jeremy_mode,
        "assigned_feature_flags": list(user.feature_flags.values_list("name", flat=True)),
    }

    # Haushaltsdaten
    household_data = None
    if user.household:
        h = user.household
        household_data = {
            "household_id": h.household_id,
            "name": h.name,
            "address": h.address,
            "postal_code": h.postal_code,
            "city": h.city,
            "currency": h.currency,
            "categories": [
                {
                    "position_id": cat.position_id,
                    "name": cat.name,
                    "type": cat.type,
                    "color_code": cat.color_code,
                    "is_standard": cat.is_standard,
                }
                for cat in h.position_categories.all()
            ],
        }

    # Eigene Einkommen
    incomes_data = [
        {
            "income_id": inc.income_id,
            "history_group_id": inc.history_group_id,
            "category": inc.position_category.name if inc.position_category else None,
            "amount": inc.amount,
            "valid_from": inc.valid_from,
            "valid_until": inc.valid_until,
        }
        # Performance-Optimierung: select_related verhindert das N+1 Query-Problem beim Export großer Datenmengen
        for inc in user.income_set.select_related("position_category").order_by("-valid_from")
    ]

    # Eigene Kostenanteile & zugehörige Kostenposten
    cost_shares_data = []
    user_shares = user.cost_shares.select_related(
        "cost_item", "cost_item__position_category"
    ).order_by("-cost_item__valid_from")

    for share in user_shares:
        item = share.cost_item
        own_amount = ((item.amount * share.percentage) / Decimal("100.0")).quantize(Decimal("0.01"))
        cost_shares_data.append({
            "cost_item_id": item.cost_item_id,
            "history_group_id": item.history_group_id,
            "name": item.name,
            "description": item.description,
            "category": item.position_category.name if item.position_category else None,
            "interval": item.interval,
            "total_item_amount": item.amount,
            "own_percentage": share.percentage,
            "own_calculated_amount": own_amount,
            "valid_from": item.valid_from,
            "valid_until": item.valid_until,
            "start_date": item.start_date,
            "end_date": item.end_date,
        })

    # Zahlungs- & Abodaten
    subscription_data = None
    if hasattr(user, "subscription"):
        sub = user.subscription
        subscription_data = {
            "subscription_id": sub.subscription_id,
            "stripe_customer_id": sub.stripe_customer_id,
            "stripe_subscription_id": sub.stripe_subscription_id,
            "status": sub.status,
            "plan": sub.plan,
            "is_active": sub.is_active,
            "current_period_end": sub.current_period_end,
            "cancel_at_period_end": sub.cancel_at_period_end,
            "updated_at": sub.updated_at,
        }

    # KI-Nutzung & Chat-Verläufe
    ai_usage_data = [
        {"date": usage.date, "count": usage.count}
        for usage in user.ai_usages.order_by("-date")
    ]

    ai_chats_data = [
        {
            "session_id": session.id,
            "title": session.title,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "messages": [
                {
                    "role": msg.role,
                    "text": msg.text,
                    "created_at": msg.created_at,
                }
                for msg in session.messages.all()
            ],
        }
        # prefetch_related lädt alle Chat-Nachrichten effizient in einer einzigen Zusatz-Query
        for session in user.ai_chat_sessions.prefetch_related("messages").all()
    ]

    return {
        "export_metadata": {
            "exported_at": timezone.now(),
            "gdpr_notice": "Datenexport gemäß Art. 15 und Art. 20 DSGVO.",
        },
        "profile": profile_data,
        "household": household_data,
        "subscription": subscription_data,
        "finances": {
            "incomes": incomes_data,
            "cost_shares": cost_shares_data,
        },
        "voice_ai": {
            "daily_usage": ai_usage_data,
            "chat_sessions": ai_chats_data,
        },
    }


def rebalance_household_costs_on_member_exit(person) -> None:
    """
    Passt alle aktiven Kostenposten eines Haushalts an, wenn ein Mitglied austritt oder gelöscht wird.
    """
    household = person.household
    if not household:
        return

    today = timezone.now().date()
    remaining_members = list(household.person_set.exclude(pk=person.pk))

    if not remaining_members:
        return

    active_items = CostItem.objects.filter(
        household=household,
        valid_until__isnull=True,
        shares__person=person
    ).prefetch_related('shares__person').distinct()

    for item in active_items:
        all_shares = list(item.shares.all())
        remaining_shares = [s for s in all_shares if s.person_id != person.person_id]

        # Historisierung: Der alte Posten wird per heute beendet, um vergangene Abrechnungen nicht zu manipulieren
        item.valid_until = today
        item.save(update_fields=['valid_until'])

        if not remaining_shares:
            continue

        new_item = CostItem.objects.create(
            household=item.household,
            history_group_id=item.history_group_id,
            position_category=item.position_category,
            name=item.name,
            description=item.description,
            interval=item.interval,
            amount=item.amount,
            start_date=item.start_date,
            end_date=item.end_date,
            valid_from=today,
            valid_until=None,
        )

        total_remaining_pct = sum(s.percentage for s in remaining_shares)
        total_assigned = Decimal('0.00')
        count = len(remaining_shares)

        for i, old_share in enumerate(remaining_shares):
            if i < count - 1:
                if total_remaining_pct > Decimal('0.00'):
                    # Dreisatz-Berechnung für das Rebalancing, damit die Verbleibenden den Anteil des Austretenden exakt auffangen
                    new_pct = (old_share.percentage / total_remaining_pct * Decimal('100.00')).quantize(
                        Decimal('0.01'), rounding=ROUND_HALF_UP
                    )
                else:
                    new_pct = (Decimal('100.00') / Decimal(count)).quantize(
                        Decimal('0.01'), rounding=ROUND_HALF_UP
                    )
            else:
                # Trick zur Vermeidung von Rundungsfehlern: Die letzte Person füllt exakt auf 100% auf
                new_pct = Decimal('100.00') - total_assigned

            CostShare.objects.create(
                cost_item=new_item,
                person=old_share.person,
                percentage=new_pct
            )
            total_assigned += new_pct


@transaction.atomic
def delete_user_account_dsgvo(user) -> None:
    """
    Löscht den Nutzer und alle seine personenbezogenen Daten restlos gemäß Art. 17 DSGVO.
    Bereinigt Einkommen, KI-Chats, eigene Kostenposten, ungenutzte Kategorien und den Haushalt.
    """
    household = user.household

    if household:
        other_members = household.person_set.exclude(pk=user.pk)

        if other_members.exists():
            # Es bleiben noch andere Personen im Haushalt zurück

            # Gemeinsame aktive Kosten auf die verbleibenden Mitbewohner (100%) umlegen
            rebalance_household_costs_on_member_exit(user)

            # Kaskadierende Bereinigung: Löscht Kostenposten, die nach dem Austritt völlig verwaist wären
            user_only_cost_items = CostItem.objects.filter(
                household=household,
                shares__person=user
            ).exclude(
                shares__person__in=other_members
            ).distinct()
            user_only_cost_items.delete()

            user.delete()

            for category in household.position_categories.filter(is_standard=False):
                # Aufräumaktion: Löscht benutzerdefinierte Kategorien, die nun leer/verwaist sind
                if not category.income_set.exists() and not category.costitem_set.exists():
                    category.delete()

        else:
            # Der User ist die einzige/letzte Person im Haushalt -> Komplettlöschung triggern
            household.costitem_set.all().delete()
            user.delete()
            household.delete()

    else:
        # User ist in gar keinem Haushalt
        user.delete()