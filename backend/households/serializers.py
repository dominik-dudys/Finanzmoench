from rest_framework import serializers
from .models import Household

class HouseholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Household
        fields = ['household_id', 'name', 'address', 'postal_code', 'city', 'currency']
        read_only_fields = ['household_id']