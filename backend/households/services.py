from django.db import transaction
from .models import Household


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