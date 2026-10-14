import re
from rest_framework import serializers
from .models import Household, PositionCategory, HouseholdJoinRequest

VALID_CURRENCIES = {'EUR', 'USD'}

class HouseholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Household
        fields = ['household_id', 'name', 'address', 'postal_code', 'city', 'currency']
        read_only_fields = ['household_id']

    def validate_currency(self, value):
        clean_currency = value.strip().upper()

        if clean_currency not in VALID_CURRENCIES:
            raise serializers.ValidationError(f"Währung wird nicht unterstützt. Erlaubt sind: {', '.join(VALID_CURRENCIES)}")
        return clean_currency

    def validate_postal_code(self, value):
        clean_plz = value.strip()

        if not re.match(r'^\d{5}$', clean_plz):
            raise serializers.ValidationError("Die Postleitzahl muss aus genau 5 Ziffern bestehen.")
        return clean_plz

    def validate_address(self, value):
        clean_address = value.strip()

        if not re.match(r'^.+\s\d+.*$', clean_address):
            raise serializers.ValidationError("Die Adresse muss im Format 'Straße Hausnummer' angegeben werden (z.B. 'Hauptstraße 42').")
        return clean_address

    def validate_city(self, value):
        clean_city = value.strip()

        if len(clean_city) < 2:
            raise serializers.ValidationError("Der Stadtname ist zu kurz.")
        return clean_city.title()


class PositionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PositionCategory
        fields = ['position_id', 'name', 'color_code', 'type', 'is_standard']
        read_only_fields = ['position_id', 'is_standard']

    def validate_color_code(self, value):
        if value and not re.match(r'^#[0-9A-Fa-f]{6}$', value):
            raise serializers.ValidationError("Farbcode muss im Format #RRGGBB sein.")
        return value


class HouseholdJoinRequestSerializer(serializers.ModelSerializer):
    person_id = serializers.UUIDField(source='person.person_id', read_only=True)
    first_name = serializers.CharField(source='person.first_name', read_only=True)
    last_name = serializers.CharField(source='person.last_name', read_only=True)
    email = serializers.EmailField(source='person.email', read_only=True)
    household_name = serializers.CharField(source='household.name', read_only=True)

    class Meta:
        model = HouseholdJoinRequest
        fields = [
            'request_id',
            'household_id',
            'household_name',
            'person_id',
            'first_name',
            'last_name',
            'email',
            'status',
            'created_at',
            'responded_at',
        ]
        read_only_fields = fields


class RespondJoinRequestSerializer(serializers.Serializer):
    approve = serializers.BooleanField(
        required=True,
        help_text="True = Anfrage annehmen, False = Anfrage ablehnen"
    )