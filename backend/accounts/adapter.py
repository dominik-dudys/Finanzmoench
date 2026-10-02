from allauth.account.adapter import DefaultAccountAdapter
from allauth.mfa.models import Authenticator
from allauth.mfa.utils import is_mfa_enabled


class AccountAdapter(DefaultAccountAdapter):
    def is_login_by_code_required(self, login):
        # Bei der Registrierung kein Login-Code
        if login.signup:
            return False
        # Mit aktiver 2FA ersetzt der Authenticator-Code den E-Mail-Code
        if login.user and is_mfa_enabled(login.user, [Authenticator.Type.TOTP]):
            return False
        return super().is_login_by_code_required(login)