from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Household, PositionCategory
from django.db import IntegrityError


@transaction.atomic
def create_household_for_user(person, validated_data):
    household = Household.objects.create(**validated_data)

    person.household = household
    person.save()

    return household


@transaction.atomic
def join_existing_household(person, household_id):
    household = Household.objects.get(household_id=household_id)

    person.household = household
    person.save()

    return household


def update_household(*, household: Household, update_data: dict) -> Household:
    for attr, value in update_data.items():
        setattr(household, attr, value)

    household.save()
    return household


def leave_household(*, person) -> None:
    person.household = None
    person.save(update_fields=['household'])


def delete_household(*, household: Household) -> None:
    household.delete()


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