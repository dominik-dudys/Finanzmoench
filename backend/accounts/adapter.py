from allauth.account.adapter import DefaultAccountAdapter

class AccountAdapter (DefaultAccountAdapter):
    def is_login_by_code_required(self, login):
        if login.signup:
            return False
        return super().is_login_by_code_required(login)