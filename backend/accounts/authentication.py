from allauth.mfa.models import Authenticator
from allauth.mfa.utils import is_mfa_enabled
from drf_spectacular.authentication import BasicScheme
from rest_framework import exceptions
from rest_framework.authentication import BasicAuthentication


class BasicAuthenticationWithoutMFA(BasicAuthentication):
    """
    HTTP Basic Auth für externe API-Clients.
    Basic Auth kennt keinen zweiten Faktor. Konten mit aktiver 2FA werden deshalb abgelehnt,
    sonst ließe sich die 2FA über die API umgehen.
    """

    def authenticate_credentials(self, userid, password, request=None):
        user, auth = super().authenticate_credentials(userid, password, request)
        if is_mfa_enabled(user, [Authenticator.Type.TOTP]):
            raise exceptions.AuthenticationFailed(
                "Basic Auth ist für Konten mit Zwei-Faktor-Authentifizierung deaktiviert."
            )
        return user, auth


class BasicAuthenticationWithoutMFAScheme(BasicScheme):
    # Damit Swagger UI den Basic-Auth-Login weiterhin anbietet
    target_class = "accounts.authentication.BasicAuthenticationWithoutMFA"
