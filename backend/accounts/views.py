import json
from django.http import HttpResponse
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from .services import generate_dsgvo_export_data
from django.shortcuts import render
from rest_framework.response import Response
from .serializers import PersonSerializer


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