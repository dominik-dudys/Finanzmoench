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
from drf_spectacular.utils import extend_schema


# Create your views here.

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Liefert die Daten des angemeldeten Nutzers für die Profilseite.")
    def get(self, request):
        return Response(PersonSerializer(request.user).data)

    @extend_schema(summary="Aktualisiert die Daten des angemeldeten Nutzers für die Profilseite.")
    def patch(self, request):
        # partial=True erlaubt das Aktualisieren einzelner Felder (z.B. nur E-Mail oder Name),
        # ohne das komplette Objekt im Request-Body senden zu müssen
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

        # DjangoJSONEncoder stellt sicher, dass Datetime-Objekte und Decimals korrekt
        # als Strings formatiert werden, was der Standard-JSON-Encoder von Python nicht kann.
        json_str = json.dumps(
            export_dict,
            indent=2,
            ensure_ascii=False,
            cls=DjangoJSONEncoder
        )

        date_str = timezone.now().strftime("%Y-%m-%d")
        filename = f"dsgvo_datenexport_{date_str}.json"

        response = HttpResponse(json_str, content_type="application/json; charset=utf-8")
        # Content-Disposition "attachment" erzwingt im Browser einen echten Datei-Download,
        # statt das JSON im Browser-Tab lediglich als Text anzuzeigen.
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class DsgvoDeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DsgvoDeleteAccountSerializer

    @extend_schema(
        summary="Account unwiderruflich löschen (Art. 17 DSGVO)",
        description=(
                "Löscht das Konto und alle damit verbundenen Daten restlos. "
                "Bestätigung per Passwort, bei Konten ohne Passwort per E-Mail-Adresse."
        ),
        request=DsgvoDeleteAccountSerializer,
        responses={
            204: OpenApiResponse(description="Account erfolgreich gelöscht."),
            400: OpenApiResponse(description="Passwort bzw. E-Mail-Adresse falsch."),
        }
    )

    def post(self, request):
        serializer = DsgvoDeleteAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        data = serializer.validated_data

        if user.has_usable_password():
            # Sicherheits-Check: Da das Löschen unwiderruflich ist (Art. 17 DSGVO),
            # muss der Nutzer seine Identität nochmals explizit durch sein Passwort bestätigen.
            if not user.check_password(data.get("password", "")):
                return Response(
                    {"error": "Das eingegebene Passwort ist nicht korrekt."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Nur Google/GitHub: Bestätigung über die eigene E-Mail-Adresse
            if data.get("confirm_email", "").strip().lower() != user.email.lower():
                return Response(
                    {"error": "Die E-Mail-Adresse stimmt nicht mit deinem Konto überein."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        delete_user_account_dsgvo(user)
        return Response(status=status.HTTP_204_NO_CONTENT)

