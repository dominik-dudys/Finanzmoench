from django.db import transaction
from django.utils import timezone
from .models import CostItem, CostShare
from rest_framework.exceptions import ValidationError

def create_cost_item(*, household, item_data: dict, shares_data: list) -> CostItem:
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
    today = timezone.now().date()
    new_amount = update_data.get('amount')

    needs_history = False
    if new_amount is not None and new_amount != cost_item.amount:
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