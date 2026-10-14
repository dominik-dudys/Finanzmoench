from decimal import Decimal
from django.utils import timezone
from accounts.models import Person


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