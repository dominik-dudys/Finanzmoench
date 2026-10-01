import re
from rest_framework import serializers
from .models import Household, PositionCategory

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