from django.utils import timezone
from rest_framework import serializers
from allauth.socialaccount.models import SocialAccount
from .models import Person


class PersonSerializer(serializers.ModelSerializer):
    login_method = serializers.SerializerMethodField()
    has_password = serializers.SerializerMethodField()
    ai_consent = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Person
        fields = [
            'person_id', 'first_name', 'last_name', 'email', 'created_at',
            'login_method', 'has_password', 'ai_consent_at', 'ai_consent',
        ]
        read_only_fields = [
            'person_id', 'email', 'created_at',
            'login_method', 'has_password', 'ai_consent_at',
        ]

    @staticmethod
    def get_login_method(obj):
        providers = list(
            SocialAccount.objects.filter(user=obj).values_list('provider', flat=True)
        )
        if obj.has_usable_password():
            providers.insert(0, 'password')
        return providers

    @staticmethod
    def get_has_password(obj):
        return obj.has_usable_password()

    def update(self, instance, validated_data):
        consent = validated_data.pop('ai_consent', None)
        if consent is True and instance.ai_consent_at is None:
            instance.ai_consent_at = timezone.now()
        elif consent is False:
            instance.ai_consent_at = None
        return super().update(instance, validated_data)