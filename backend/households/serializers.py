import re
from rest_framework import serializers
from .models import Household, PositionCategory

VALID_CURRENCIES = {'EUR', 'USD'}
HEX_COLOR = re.compile(r"^#[0-9A-Fa-f]{6}$")

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
    contract_count = serializers.SerializerMethodField()

    class Meta:
        model = PositionCategory
        fields = ["position_id", "name", "color_code", "contract_count"]
        read_only_fields = ["position_id"]

    def get_contract_count(self, obj):
        # nur in der Liste annotiert (Anzahl aktiver Verträge), sonst None
        return getattr(obj, "contract_count", None)

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Der Name darf nicht leer sein.")

        qs = PositionCategory.objects.filter(household=self.context["household"], name__iexact=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Eine Kategorie mit diesem Namen gibt es bereits.")
        return name

    def validate_color_code(self, value):
        if value in (None, ""):
            return None
        if not HEX_COLOR.match(value):
            raise serializers.ValidationError("Die Farbe muss im Format #RRGGBB angegeben werden.")
        return value.upper()