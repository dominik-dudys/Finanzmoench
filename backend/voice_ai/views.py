import logging

from urllib.parse import quote
from django.http import HttpResponse
from rest_framework import status

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from google.genai import errors as genai_errors

from .quota import get_usage, record_usage
from .models import AiChatSession
from .serializers import (
    JeremyTipRequestSerializer,
    AiChatSessionListSerializer,
    AiChatSessionDetailSerializer
)
from .services import generate_jeremy_response, generate_tts_audio, delete_chat_session

from feature_flags.services import is_flag_active
from drf_spectacular.utils import extend_schema

# Create your views here.

logger = logging.getLogger(__name__)

class JeremyTipView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request = JeremyTipRequestSerializer,
        summary="Sendet eine Nutzerfrage an Gemini und generiert die Antwort.",
    )


    def post(self, request):
        if not is_flag_active("jeremy_ai", request.user):
            return Response({"code": "jeremy_disabled"}, status=503)
        if request.user.ai_consent_at is None:
            return Response({"code": "ai_consent_required"}, status=403)

        usage = get_usage(request.user)
        if usage["remaining"] <= 0:
            return Response({"code": "ai_quota_exceeded", "params": usage}, status=429)

        serializer = JeremyTipRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        question = serializer.validated_data["question"]
        session_id = serializer.validated_data.get("session_id")

        try:
            jeremy_text, chat_session = generate_jeremy_response(request.user, question, session_id)
            audio_bytes = generate_tts_audio(jeremy_text)

            record_usage(request.user)

            response = HttpResponse(audio_bytes, content_type="audio/mpeg")
            response["X-Jeremy-Text"] = quote(jeremy_text)
            response["X-Chat-Session-Id"] = str(chat_session.id)
            response["Access-Control-Expose-Headers"] = "X-Jeremy-Text, X-Chat-Session-Id"

            return response

        except AiChatSession.DoesNotExist:
            return Response({"code": "session_not_found"}, status=404)
        except genai_errors.APIError as e:
            logger.error("Gemini-Fehler [%s]: %s", e.code, e)
            return Response({"code": "ai_busy" if e.code in (429, 503) else "ai_error"}, status=502)
        except Exception as e:
            logger.critical("Kritischer Fehler in JeremyTipView: %s", str(e), exc_info=True)
            return Response({"code": "server_error"}, status=500)


class AiSessionListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Listet alle bisherigen Chats mit der KI auf.")

    def get(self, request):
        sessions = AiChatSession.objects.filter(person=request.user)
        serializer = AiChatSessionListSerializer(sessions, many=True)
        return Response(serializer.data)


class AiSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Ruft den angegebenen KI-Chat auf.")

    def get(self, request, session_id):
        try:
            session = AiChatSession.objects.get(id=session_id, person=request.user)
            serializer = AiChatSessionDetailSerializer(session)
            return Response(serializer.data)
        except AiChatSession.DoesNotExist:
            return Response({"code": "not_found"}, status=404)


class AiUsageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Zeigt, wie viele Anfragen der Benutzer an die KI noch übrig hat.")

    def get(self, request):
        return Response(get_usage(request.user))


class AiSessionDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Löscht den angegebenen KI-Chat vollständig.")

    def delete(self, request, session_id):
        success = delete_chat_session(request.user, session_id)

        if success:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(
                {"error": "Chat nicht gefunden oder keine Berechtigung."},
                status=status.HTTP_404_NOT_FOUND
            )