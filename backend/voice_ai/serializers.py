from rest_framework import serializers
from .models import AiChatSession, AiChatMessage

class JeremyTipRequestSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=1000, default="Wie investiere ich mein Geld?")
    session_id = serializers.UUIDField(required=False, allow_null=True)

class AiChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiChatMessage
        fields = ['role', 'text', 'created_at']

class AiChatSessionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiChatSession
        fields = ['id', 'title', 'updated_at']

class AiChatSessionDetailSerializer(serializers.ModelSerializer):
    messages = AiChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AiChatSession
        fields = ['id', 'title', 'messages']