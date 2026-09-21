from django.db import transaction
from django.utils import timezone
from .models import CostItem, CostShare

def create_cost_item(*, household, item_data: dict, shares_data: list) -> CostItem:
    with transaction.atomic():
        cost_item = CostItem.objects.create(
            household=household,
            valid_from=timezone.now().date(),
            **item_data
        )

        for share_data in shares_data:
            CostShare.objects.create(
                cost_item=cost_item,
                **share_data
            )

    return cost_item


def update_cost_item(*, cost_item: CostItem, update_data: dict, shares_data: list = None) -> CostItem:
    today = timezone.now().date()
    new_amount = update_data.get('amount')

    with transaction.atomic():

        # Anlegen eines neuen Postens, wenn der bisherige Betrag aktualisiert wird
        if new_amount is not None and new_amount != cost_item.amount:

            cost_item.valid_until = today
            cost_item.save(update_fields=['valid_until'])

            new_item_data = {
                'household': cost_item.household,
                'history_group_id': cost_item.history_group_id, # Die Klammer um die Gruppe bleibt gleich
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
                    CostShare.objects.create(cost_item=new_item, **share)

            else:

                for old_share in cost_item.shares.all():
                    CostShare.objects.create(
                        cost_item=new_item,
                        person=old_share.person,
                        percentage=old_share.percentage
                    )

            return new_item

        # Update des bisherigen postens, wenn sich der Betrag nicht geändert hat
        else:

            for attr, value in update_data.items():
                setattr(cost_item, attr, value)
            cost_item.save()

            if shares_data is not None:
                cost_item.shares.all().delete()
                for share in shares_data:
                    CostShare.objects.create(cost_item=cost_item, **share)

            return cost_item