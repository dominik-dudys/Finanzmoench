from rest_framework import serializers
from allauth.socialaccount.models import SocialAccount
from .models import Person


class PersonSerializer(serializers.ModelSerializer):
    login_method = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = ['person_id', 'first_name', 'last_name', 'email', 'created_at', 'login_method']
        read_only_fields = ['person_id', 'email', 'created_at', 'login_method']

    @staticmethod
    def get_login_method(obj):
        providers = list(
            SocialAccount.objects.filter(user=obj).values_list('provider', flat=True)
        )
        return providers if providers else ['password']