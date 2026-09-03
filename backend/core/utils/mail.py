from django.core.mail import send_mail
from django.conf import settings

def sende_test_mail(empfaenger_adresse):
    betreff = "Testmail von unserem VPS Setup"
    nachricht = "Hallo! Wenn du das liest, funktioniert die Verbindung zwischen Django und IONOS perfekt."

    try:
        # Djangos Standard-Befehl für den Mailversand
        send_mail(
            subject=betreff,
            message=nachricht,
            from_email=settings.DEFAULT_FROM_EMAIL, # Zieht die Adresse aus settings.py
            recipient_list=[empfaenger_adresse],
            fail_silently=False, # Wichtig zum Testen: Wirft einen Fehler, wenn es scheitert
        )
        print("Erfolg! E-Mail wurde an IONOS übergeben.")
        return True
    except Exception as e:
        print(f"Fehler beim Senden: {e}")
        return False