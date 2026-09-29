from django.db import transaction
from django.utils import timezone
from .models import CostItem, CostShare, Income
from accounts.models import Person
from rest_framework.exceptions import ValidationError
from datetime import date
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum
from decimal import Decimal, ROUND_HALF_UP


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

    category = update_data.get('position_category')
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


def create_income(person, amount, position_category=None):
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


def calculate_shares_for_mode(household, mode: str, custom_shares: list = None, exclude_category_ids: list = None) -> list:
    if mode == 'custom':
        return custom_shares

    members = Person.objects.filter(household=household)
    member_count = members.count()

    if member_count == 0:
        raise ValidationError("Der Haushalt hat keine Mitglieder.")

    calculated_shares = []
    total_assigned = Decimal('0.00')

    if mode == 'equal':
        base_share = (Decimal('100.00') / Decimal(member_count)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        for i, member in enumerate(members):
            share_val = base_share if i < member_count - 1 else Decimal('100.00') - total_assigned
            calculated_shares.append({'person': member, 'percentage': share_val})
            total_assigned += share_val

    elif mode == 'fair':
        total_household_income = Decimal('0.00')
        member_incomes = []

        for member in members:
            income_query = Income.objects.filter(
                person=member,
                valid_until__isnull=True
            )

            if exclude_category_ids:
                income_query = income_query.exclude(position_category_id__in=exclude_category_ids)

            active_income = income_query.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            total_household_income += active_income
            member_incomes.append({'person': member, 'income': active_income})

        if total_household_income == Decimal('0.00'):
            raise ValidationError("Das anrechenbare Haushaltseinkommen liegt bei 0. Fair-Split nicht berechenbar.")

        for i, item in enumerate(member_incomes):
            if i < member_count - 1:
                share_val = (item['income'] / total_household_income * Decimal('100.00')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            else:
                share_val = Decimal('100.00') - total_assigned

            calculated_shares.append({'person': item['person'], 'percentage': share_val})
            total_assigned += share_val

    return calculated_shares


@transaction.atomic
def bulk_update_cost_shares(*, household, split_mode: str, shares_data: list = None, cost_item_ids: list = None, exclude_category_ids: list = None) -> list:
    final_shares = calculate_shares_for_mode(household, split_mode, shares_data, exclude_category_ids)

    items_query = CostItem.objects.filter(household=household, valid_until__isnull=True)
    if cost_item_ids:
        items_query = items_query.filter(cost_item_id__in=cost_item_ids)

    updated_items = []
    for item in items_query:
        new_item = update_cost_item(
            cost_item=item,
            household=household,
            update_data={},
            shares_data=final_shares
        )
        updated_items.append(new_item)

    return updated_items