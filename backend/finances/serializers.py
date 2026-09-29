from rest_framework import serializers
from .models import CostItem, Income, CostShare
from households.models import PositionCategory
from decimal import Decimal
from django.db import transaction
from django.utils import timezone


class CostShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostShare
        fields = ['person', 'percentage']


class CostItemSerializer(serializers.ModelSerializer):
    shares = CostShareSerializer(many=True)

    position_category = serializers.PrimaryKeyRelatedField(
        queryset=PositionCategory.objects.all(),
        required=True,
        error_messages={'null': 'Bitte wähle eine Kategorie aus.', 'required': 'Dieses Feld ist zwingend erforderlich.'}
    )

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
            "shares",
        ]
        read_only_fields = ["cost_item_id", "history_group_id", "household"]

    def validate_shares(self, value):
            if not value:
                raise serializers.ValidationError("Es muss mindestens ein Share angegeben werden!")

            total = sum(share['percentage'] for share in value)

            if total != Decimal('100.00'):
                raise serializers.ValidationError(f"Die Aufteilung muss exakt 100% ergeben. Aktuell: {total}%")

            return value


class IncomeSerializer(serializers.ModelSerializer):
    position_category = serializers.PrimaryKeyRelatedField(
        queryset=PositionCategory.objects.all(),
        required=True,
        error_messages={'null': 'Bitte wähle eine Kategorie aus.', 'required': 'Dieses Feld ist zwingend erforderlich.'}
    )

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


class GlobalSharesSerializer(serializers.Serializer):
    SPLIT_CHOICES = [
        ('custom', 'Nutzerdefiniert'),
        ('equal', 'Gleichmäßig (z.B. 50/50)'),
        ('fair', 'Fair (nach Einkommen)')
    ]

    split_mode = serializers.ChoiceField(choices=SPLIT_CHOICES, default='custom')

    cost_item_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
    )

    exclude_income_category_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        help_text="Liste von Einkommenskategorie-IDs, die bei der Fair-Berechnung ignoriert werden sollen."
    )

    shares = CostShareSerializer(many=True, required=False)

    def validate(self, data):
        mode = data.get('split_mode', 'custom')
        shares = data.get('shares', [])

        if mode == 'custom':
            if not shares:
                raise serializers.ValidationError({"shares": "Bei 'custom' müssen Shares angegeben werden."})

            total = sum(share['percentage'] for share in shares)
            if total != Decimal('100.00'):
                raise serializers.ValidationError({"shares": f"Die Aufteilung muss exakt 100% ergeben. Aktuell: {total}%"})

        return data