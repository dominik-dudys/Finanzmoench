from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import Household, PositionCategory, HouseholdJoinRequest
from finances.models import Income
from accounts.services import rebalance_household_costs_on_member_exit


@transaction.atomic
def create_household_for_user(person, validated_data):
    if person.household is not None:
        raise ValidationError("Du gehörst bereits einem Haushalt an.")

    household = Household.objects.create(**validated_data)

    person.household = household
    person.save(update_fields=['household'])

    HouseholdJoinRequest.objects.filter(
        person=person,
        status=HouseholdJoinRequest.StatusChoices.PENDING
    ).delete()

    return household


@transaction.atomic
def request_to_join_household(*, person, household_id) -> HouseholdJoinRequest:

    if person.household is not None:
        raise ValidationError("Du bist bereits Mitglied in einem Haushalt.")

    try:
        household = Household.objects.get(household_id=household_id)
    except Household.DoesNotExist:
        raise ValidationError("Ein Haushalt mit dieser ID existiert nicht.")

    existing_request = HouseholdJoinRequest.objects.filter(
        household=household,
        person=person,
        status=HouseholdJoinRequest.StatusChoices.PENDING
    ).first()

    if existing_request:
        raise ValidationError("Du hast bereits eine offene Beitrittsanfrage für diesen Haushalt.")

    return HouseholdJoinRequest.objects.create(
        household=household,
        person=person,
        status=HouseholdJoinRequest.StatusChoices.PENDING
    )


@transaction.atomic
def respond_to_join_request(*, responder, request_id, approve: bool) -> HouseholdJoinRequest:

    try:
        join_request = HouseholdJoinRequest.objects.select_related('person', 'household').get(
            request_id=request_id
        )
    except HouseholdJoinRequest.DoesNotExist:
        raise ValidationError("Beitrittsanfrage nicht gefunden.")

    if responder.household_id != join_request.household_id:
        raise ValidationError("Du bist nicht berechtigt, über Anfragen dieses Haushalts zu entscheiden.")

    if join_request.status != HouseholdJoinRequest.StatusChoices.PENDING:
        raise ValidationError("Diese Anfrage wurde bereits bearbeitet.")

    applicant = join_request.person

    if approve:
        if applicant.household is not None:
            join_request.status = HouseholdJoinRequest.StatusChoices.REJECTED
            join_request.responded_at = timezone.now()
            join_request.responded_by = responder
            join_request.save()
            raise ValidationError("Die Person ist inzwischen bereits einem anderen Haushalt beigetreten.")

        applicant.household = join_request.household
        applicant.save(update_fields=['household'])

        join_request.status = HouseholdJoinRequest.StatusChoices.APPROVED
        join_request.responded_at = timezone.now()
        join_request.responded_by = responder
        join_request.save()

        HouseholdJoinRequest.objects.filter(
            person=applicant,
            status=HouseholdJoinRequest.StatusChoices.PENDING
        ).exclude(pk=join_request.pk).delete()

    else:
        join_request.status = HouseholdJoinRequest.StatusChoices.REJECTED
        join_request.responded_at = timezone.now()
        join_request.responded_by = responder
        join_request.save()

    return join_request


def update_household(*, household: Household, update_data: dict) -> Household:
    for attr, value in update_data.items():
        setattr(household, attr, value)

    household.save()
    return household


@transaction.atomic
def delete_household(*, household: Household) -> None:
    Income.objects.filter(position_category__household=household).delete()
    household.costitem_set.all().delete()
    household.person_set.all().update(household=None)
    household.delete()


@transaction.atomic
def leave_household(*, person) -> None:
    household = person.household
    if not household:
        raise ValidationError("Du gehörst aktuell keinem Haushalt an.")

    other_members_exist = household.person_set.exclude(pk=person.pk).exists()

    if not other_members_exist:
        delete_household(household=household)
        person.household = None
    else:
        rebalance_household_costs_on_member_exit(person)

        today = timezone.now().date()
        Income.objects.filter(person=person, valid_until__isnull=True).update(valid_until=today)
        Income.objects.filter(person=person, position_category__household=household).delete()

        person.household = None
        person.save(update_fields=['household'])


def create_category(household, data: dict) -> PositionCategory:
    try:
        return PositionCategory.objects.create(
            household=household,
            is_standard=False,
            **data
        )
    except IntegrityError:
        raise ValidationError(f"Eine {data.get('type')}-Kategorie mit dem Namen '{data.get('name')}' existiert bereits.")


def update_category(category: PositionCategory, data: dict) -> PositionCategory:
    if category.is_standard:
        raise ValidationError("Standardkategorien können nicht bearbeitet werden.")

    for attr, value in data.items():
        setattr(category, attr, value)

    try:
        category.save()
    except IntegrityError:
        raise ValidationError("Eine Kategorie mit diesem Namen existiert bereits.")

    return category


@transaction.atomic
def delete_category_safe(category: PositionCategory, fallback_category: PositionCategory = None):
    if category.is_standard:
        raise ValidationError("Standardkategorien können nicht gelöscht werden.")

    has_incomes = category.income_set.exists()
    has_costs = category.costitem_set.exists()

    if has_incomes or has_costs:
        if not fallback_category:
            raise ValidationError("Diese Kategorie wird noch verwendet. Bitte gib eine Ersatzkategorie an.")

        if fallback_category.position_id == category.position_id:
            raise ValidationError("Die Ersatzkategorie darf nicht die zu löschende Kategorie sein.")

        if fallback_category.household != category.household:
            raise ValidationError("Die Ersatzkategorie gehört nicht zu diesem Haushalt.")

        if fallback_category.type != category.type:
            raise ValidationError("Die Ersatzkategorie muss vom selben Typ sein (Einkommen/Ausgabe).")

        if has_incomes:
            category.income_set.update(position_category=fallback_category)
        if has_costs:
            category.costitem_set.update(position_category=fallback_category)

    category.delete()