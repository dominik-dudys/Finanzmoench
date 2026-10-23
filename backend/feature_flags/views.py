from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .services import get_flags_for_user


class FlagsView(APIView):
    # AllowAny ist hier bewusst gewählt: Das Frontend muss auch für nicht eingeloggte Besucher
    # wissen können, welche Features auf der Landingpage (z.B. neue Login-UI) aktiv sind.
    permission_classes = [AllowAny]

    @extend_schema(summary="Macht die Featureflags zugänglich und prüft ihren Zustand.")
    def get(self, request):
        return Response(get_flags_for_user(request.user))