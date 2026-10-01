from rest_framework import serializers
from .models import CostItem, Income, CostShare
from decimal import Decimal
from django.db import transaction
from django.utils import timezone


class CostShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostShare
        fields = ['person', 'percentage']


class CostItemSerializer(serializers.ModelSerializer):
    shares = CostShareSerializer(many=True)

    class Meta:
        model = CostItem
        fields = [
            "cost_item_id",
            "history_group_id",
            "household",
            "position_category",
            "name",
            "amount",
            "description",
            "interval",
            "start_date",
            "end_date",
            "valid_from",
            "valid_until",
            "shares",
        ]
        read_only_fields = ["cost_item_id", "history_group_id", "household", "valid_from", "valid_until"]

    def validate_shares(self, value):
            if not value:
                raise serializers.ValidationError("Es muss mindestens ein Share angegeben werden!")

            total = sum(share['percentage'] for share in value)

            if total != Decimal('100.00'):
                raise serializers.ValidationError(f"Die Aufteilung muss exakt 100% ergeben. Aktuell: {total}%")

            return value

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "Das Enddatum darf nicht vor dem Startdatum liegen."}
            )
        return attrs


class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = [
            "income_id",
            "person",
            "amount",
            "valid_from",
            "valid_until",
            "position_category",
        ]
        read_only_fields = ["income_id", "valid_until", "person", "valid_from"]
