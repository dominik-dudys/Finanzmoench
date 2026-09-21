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