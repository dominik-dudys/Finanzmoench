from django import forms


class SignupForm(forms.Form):
    """Zusätzliche Felder bei der Registrierung (allauth ruft signup() nach dem Anlegen auf)."""
    first_name = forms.CharField(max_length=100, label="Vorname")
    last_name = forms.CharField(max_length=100, label="Nachname")

    def signup(self, request, user):
        user.first_name = self.cleaned_data["first_name"]
        user.last_name = self.cleaned_data["last_name"]
        user.save(update_fields=["first_name", "last_name"])