import json
from django.http import HttpResponse
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from .services import generate_dsgvo_export_data, delete_user_account_dsgvo
from django.shortcuts import render
from rest_framework.response import Response
from .serializers import PersonSerializer, DsgvoDeleteAccountSerializer


# Create your views here.

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(PersonSerializer(request.user).data)

    def patch(self, request):
        serializer = PersonSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class DsgvoDataExportView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="DSGVO-Datenexport (Art. 20 DSGVO)",
        description="Lädt alle über den aktuell eingeloggten Nutzer gespeicherten Daten als JSON-Datei herunter.",
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.BINARY,
                description="JSON-Datei mit allen personenbezogenen Daten."
            )
        }
    )
    def get(self, request):
        export_dict = generate_dsgvo_export_data(request.user)

        json_str = json.dumps(
            export_dict,
            indent=2,
            ensure_ascii=False,
            cls=DjangoJSONEncoder
        )

        date_str = timezone.now().strftime("%Y-%m-%d")
        filename = f"dsgvo_datenexport_{date_str}.json"

        response = HttpResponse(json_str, content_type="application/json; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class DsgvoDeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DsgvoDeleteAccountSerializer

    @extend_schema(
        summary="Account unwiderruflich löschen (Art. 17 DSGVO)",
        description="Löscht das Konto und alle damit verbundenen Daten restlos. Erfordert das Passwort zur Bestätigung.",
        request=DsgvoDeleteAccountSerializer,
        responses={
            204: OpenApiResponse(description="Account erfolgreich gelöscht."),
            400: OpenApiResponse(description="Falsches Passwort."),
        }
    )
    def post(self, request):
        serializer = DsgvoDeleteAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        password = serializer.validated_data["password"]

        if not user.check_password(password):
            return Response(
                {"error": "Das eingegebene Passwort ist nicht korrekt."},
                status=status.HTTP_400_BAD_REQUEST
            )

        delete_user_account_dsgvo(user)
        return Response(status=status.HTTP_204_NO_CONTENT)