from allauth.mfa.stages import AuthenticateStage


class SocialSkipMFAAuthenticateStage(AuthenticateStage):
    """
    2FA nur beim Login mit E-Mail/Passwort bzw. Code.
    Bei Google/GitHub übernimmt der Provider die Absicherung.
    """

    def _should_handle(self, request) -> bool:
        signal_kwargs = self.login.signal_kwargs or {}
        if signal_kwargs.get("sociallogin") is not None:
            return False
        return super()._should_handle(request)