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