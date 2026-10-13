import uuid
from datetime import timedelta
from decimal import Decimal

from allauth.account.models import EmailAddress
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Person
from feature_flags.models import FeatureFlag
from finances.models import CostItem, CostShare, Income
from households.models import Household, PositionCategory
from payment.models import Subscription
from voice_ai.quota import _today
from voice_ai.models import AiUsage

PASSWORD = "E2e-Passwort-123!"

HOUSEHOLD_IDS = {
    "dashboard": uuid.UUID("10000000-0000-0000-0000-000000000001"),
    "kosten": uuid.UUID("10000000-0000-0000-0000-000000000002"),
    "einkommen": uuid.UUID("10000000-0000-0000-0000-000000000003"),
    "kategorien": uuid.UUID("10000000-0000-0000-0000-000000000004"),
    "beitritt": uuid.UUID("10000000-0000-0000-0000-000000000005"),
    "bearbeiten": uuid.UUID("10000000-0000-0000-0000-000000000006"),
    "verlassen": uuid.UUID("10000000-0000-0000-0000-000000000007"),
    "aufloesen": uuid.UUID("10000000-0000-0000-0000-000000000008"),
}

HOUSEHOLDS = {
    "dashboard": ("WG Dashboard", "Teststraße 1", "30159", "Hannover"),
    "kosten": ("WG Kosten", "Kostenweg 2", "30159", "Hannover"),
    "einkommen": ("WG Einkommen", "Gehaltsallee 3", "30159", "Hannover"),
    "kategorien": ("WG Kategorien", "Farbgasse 4", "30159", "Hannover"),
    "beitritt": ("WG Beitritt", "Eingangsstraße 5", "30159", "Hannover"),
    "bearbeiten": ("WG Bearbeiten", "Altbauweg 6", "30159", "Hannover"),
    "verlassen": ("WG Verlassen", "Auszugstraße 7", "30159", "Hannover"),
    "aufloesen": ("WG Auflösen", "Abrissweg 8", "30159", "Hannover"),
}

PERSONAS = [
    ("anna", "Anna", "Admin", "dashboard"),
    ("max", "Max", "Mitbewohner", "dashboard"),
    ("kosten", "Karla", "Kosten", "kosten"),
    ("einkommen", "Erika", "Einkommen", "einkommen"),
    ("ilse", "Ilse", "Mitbewohnerin", "einkommen"),
    ("kategorie", "Kai", "Kategorie", "kategorien"),
    ("ben", "Ben", "Neu", None),
    ("dora", "Dora", "Gastgeberin", "beitritt"),
    ("clara", "Clara", "Gast", None),
    ("edith", "Edith", "Editor", "bearbeiten"),
    ("lena", "Lena", "Leaver", "verlassen"),
    ("leo", "Leo", "Bleiber", "verlassen"),
    ("dieter", "Dieter", "Delete", "aufloesen"),
    ("paula", "Paula", "Profil", None),
    ("peter", "Peter", "Passwort", None),
    ("vera", "Vera", "Vergessen", None),
    ("tom", "Tom", "Totp", None),
    ("logout", "Lou", "Logout", None),
    ("jonas", "Jonas", "Jeremy", None),
    ("jule", "Jule", "Limit", None),
    ("prem", "Pia", "Premium", None),
    ("frei", "Fritz", "Free", None),
    ("karl", "Karl", "Konsent", None),
]

CONSENTED = {"jule", "prem", "karl"}


def email_for(key):
    return f"{key}@e2e.test"


class Command(BaseCommand):
    help = "Legt die festen Testdaten für die Playwright-E2E-Tests an."

    @transaction.atomic
    def handle(self, *args, **options):
        today = timezone.now().date()
        now = timezone.now()

        for name in ("jeremy_ai", "two_factor"):
            FeatureFlag.objects.update_or_create(
                name=name,
                defaults={"enabled": True, "rollout_percent": 100, "description": "E2E"},
            )

        households = {}
        for key, (name, address, postal_code, city) in HOUSEHOLDS.items():
            households[key] = Household.objects.create(
                household_id=HOUSEHOLD_IDS[key],
                name=name,
                address=address,
                postal_code=postal_code,
                city=city,
                currency="EUR",
            )

        people = {}
        for key, first, last, household_key in PERSONAS:
            person = Person.objects.create_user(
                email=email_for(key),
                password=PASSWORD,
                first_name=first,
                last_name=last,
                household=households.get(household_key),
            )
            if key in CONSENTED:
                person.ai_consent_at = now
                person.save(update_fields=["ai_consent_at"])
            EmailAddress.objects.create(user=person, email=person.email, verified=True, primary=True)
            people[key] = person

        def category(household_key, name):
            return PositionCategory.objects.get(household=households[household_key], name=name)

        def cost(household_key, name, amount, category_name, shares):
            item = CostItem.objects.create(
                household=households[household_key],
                position_category=category(household_key, category_name),
                name=name,
                amount=Decimal(amount),
                interval=CostItem.IntervalChoices.MONTHLY,
                valid_from=today,
            )
            for person_key, percentage in shares:
                CostShare.objects.create(cost_item=item, person=people[person_key], percentage=Decimal(percentage))
            return item

        def income(person_key, household_key, amount, category_name, valid_from=None, valid_until=None):
            return Income.objects.create(
                person=people[person_key],
                position_category=category(household_key, category_name),
                amount=Decimal(amount),
                valid_from=valid_from or today,
                valid_until=valid_until,
            )

        cost("dashboard", "Miete", "900.00", "Miete & Nebenkosten", [("anna", "50.00"), ("max", "50.00")])
        cost("dashboard", "Internet", "40.00", "Freizeit & Abos", [("anna", "50.00"), ("max", "50.00")])
        income("anna", "dashboard", "2500.00", "Gehalt")
        income("max", "dashboard", "1500.00", "Gehalt")

        income("ilse", "einkommen", "1800.00", "Gehalt")
        income(
            "einkommen",
            "einkommen",
            "250.00",
            "Kindergeld",
            valid_from=today - timedelta(days=20),
            valid_until=today - timedelta(days=3),
        )

        AiUsage.objects.create(person=people["jule"], date=_today(), count=2)

        Subscription.objects.create(
            person=people["prem"],
            stripe_customer_id="cus_e2e_premium",
            stripe_subscription_id="sub_e2e_premium",
            status="active",
            current_period_end=now + timedelta(days=30),
        )

        self.stdout.write(self.style.SUCCESS(f"E2E-Testdaten angelegt: {len(people)} Personen, {len(households)} Haushalte"))
