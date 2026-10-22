from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .services import get_flags_for_user


class FlagsView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(summary="Macht die Featureflags zugänglich und prüft ihren Zustand.")
    def get(self, request):
        return Response(get_flags_for_user(request.user))