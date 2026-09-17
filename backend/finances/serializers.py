from rest_framework import serializers
from .models import CostItem, ItemEntry, Income, Transaction


class CostItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostItem
        fields = [
            "cost_item_id",
            "household",
            "position_category",
            "name",
            "description",
            "interval",
        ]
        read_only_fields = ["cost_item_id", "household"]


class ItemEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemEntry
        fields = [
            "item_entry_id",
            "cost_item",
            "amount",
            "valid_from",
            "valid_until",
            "note",
        ]
        read_only_fields = ["item_entry_id"]


class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = [
            "income_id",
            "person",
            "position_category",
            "amount",
            "valid_from",
            "valid_until",
        ]
        read_only_fields = ["income_id", "person"]


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "transaction_id",
            "person",
            "position_category",
            "amount",
            "date",
            "note",
        ]
        read_only_fields = ["transaction_id", "person", "date"]