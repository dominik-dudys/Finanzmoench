from django.db import transaction
from django.utils import timezone
from .models import CostItem, CostShare, Income
from rest_framework.exceptions import ValidationError
from datetime import date
from django.shortcuts import get_object_or_404
from django.db.models import Q
from decimal import Decimal


def get_price_for_date(cost_item, target_date: date):
    entry = (
        cost_item.price_history
        .filter(valid_from__lte=target_date)
        .filter(Q(valid_until__isnull=True) | Q(valid_until__gte=target_date))
        .order_by("-valid_from")
        .first()
    )

    if not entry:
        raise ValueError("Für das angegebene Datum ist kein gültiger Preis vorhanden.")

    return entry.amount

def create_cost_item(*, household, item_data: dict, shares_data: list) -> CostItem:

    category = item_data.get('position_category')
        if category and category.household != household:
            raise ValidationError("Diese Kategorie gehört nicht zu diesem Haushalt.")

    with transaction.atomic():
        cost_item = CostItem.objects.create(
            household=household,
            valid_from=timezone.now().date(),
            **item_data
        )

        for share_data in shares_data:
            person = share_data['person']

            if person.household != household:
                raise ValidationError(f"Nutzer {person.first_name} gehört nicht zu diesem Haushalt.")

            CostShare.objects.create(
                cost_item=cost_item,
                **share_data
            )

    return cost_item


def update_cost_item(*, cost_item: CostItem, household, update_data: dict, shares_data: list = None) -> CostItem:

    category = item_data.get('position_category')
        if category and category.household != household:
            raise ValidationError("Diese Kategorie gehört nicht zu diesem Haushalt.")

    today = timezone.now().date()
    new_amount = update_data.get('amount')
    update_data.pop('valid_from', None)

    needs_history = False
    if new_amount is not None and Decimal(str(new_amount)) != cost_item.amount:
        needs_history = True
    if shares_data is not None:
        needs_history = True

    with transaction.atomic():

        if needs_history:
            # Anlegen eines neuen Postens, wenn der bisherige Betrag oder die Verteilung aktualisiert wird

            cost_item.valid_until = today
            cost_item.save(update_fields=['valid_until'])

            new_item_data = {
                'household': cost_item.household,
                'history_group_id': cost_item.history_group_id,
                'position_category': cost_item.position_category,
                'name': cost_item.name,
                'description': cost_item.description,
                'interval': cost_item.interval,
                'amount': cost_item.amount,
                'valid_from': today,
            }
            new_item_data.update(update_data)
            new_item = CostItem.objects.create(**new_item_data)

            if shares_data is not None:

                for share in shares_data:
                    person = share['person']

                    if person.household != household:
                        raise ValidationError(f"Nutzer {person.first_name} gehört nicht zu diesem Haushalt.")

                    CostShare.objects.create(cost_item=new_item, **share)
            else:

                for old_share in cost_item.shares.all():
                    CostShare.objects.create(
                        cost_item=new_item,
                        person=old_share.person,
                        percentage=old_share.percentage
                    )

            return new_item

        else:
            # Update des bisherigen postens, wenn sich der Betrag oder die Verteilung nicht geändert hat
            for attr, value in update_data.items():
                setattr(cost_item, attr, value)
            cost_item.save()

            return cost_item


def delete_cost_item(*, cost_item: CostItem) -> CostItem:
    cost_item.valid_until = timezone.now().date()
    cost_item.save(update_fields=['valid_until'])
    return cost_item


def create_income(person, amount, valid_from, position_category=None):
    if position_category and position_category.household != person.household:
            raise ValidationError("Diese Kategorie gehört nicht zu deinem Haushalt.")

    return Income.objects.create(
        person=person,
        amount=amount,
        valid_from=date.today(),
        position_category=position_category
    )


@transaction.atomic
def update_income(income, update_data):
    category = update_data.get('position_category')
        if category and category.household != income.person.household:
            raise ValidationError("Diese Kategorie gehört nicht zu deinem Haushalt.")

    new_amount = update_data.get('amount')
    update_data.pop('valid_from', None)

    needs_history = False
        if new_amount is not None and Decimal(str(new_amount)) != income.amount:
            needs_history = True

        if 'position_category' in update_data and update_data['position_category'] != income.position_category:
            needs_history = True

        if needs_history:
            today = date.today()
            income.valid_until = today
            income.save(update_fields=['valid_until'])

            final_amount = new_amount if new_amount is not None else income.amount
            final_category = update_data.get('position_category', income.position_category)

            new_income = Income.objects.create(
                history_group_id=income.history_group_id,
                person=income.person,
                amount=final_amount,
                valid_from=today,
                position_category=final_category
            )
            return new_income

        for attr, value in update_data.items():
            setattr(income, attr, value)
        income.save()
        return income


def delete_income(income):
    income.valid_until = date.today()
    income.save()
    return income