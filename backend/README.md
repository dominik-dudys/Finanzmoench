Finanzmoench — Backend

Django REST API für Finanzmoench.

Stack
Django + Django REST Framework
django-cors-headers (für den Vite-Dev-Server)
python-dotenv (Konfiguration über .env)
SQLite (Standard, keine Extra-Installation nötig)
Voraussetzungen
Python 3.12 oder neuer (python3 --version)
Git
Setup

Im Ordner backend/:

bash
# 1. Virtuelle Umgebung anlegen
python3 -m venv .venv

# 2. Aktivieren
source .venv/bin/activate          # macOS / Linux
.venv\Scripts\activate             # Windows

# 3. Abhängigkeiten installieren
pip install -r requirements.txt

# 4. .env anlegen
cp .env.example .env

# 5. Datenbank aufbauen
python manage.py migrate

# 6. Admin-Zugang anlegen (optional)
python manage.py createsuperuser
Starten
bash
source .venv/bin/activate
python manage.py runserver

Die API läuft dann auf http://localhost:8000. Das Admin-Interface liegt unter http://localhost:8000/admin.

Das Frontend wird separat gestartet — siehe frontend/README.md.

.env

Die .env liegt nicht im Repo. .env.example zeigt, welche Variablen gebraucht werden:

Variable	Bedeutung
SECRET_KEY	Django Secret Key, beliebiger langer Zufallsstring
DEBUG	True in der Entwicklung, False in Produktion

Neuen Secret Key erzeugen:

bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
Projektstruktur
backend/
├── config/          # Django-Projekt: settings.py, urls.py
├── core/            # App mit Models, Views, Serializers
├── manage.py
├── requirements.txt
└── .env.example
Nach einem git pull

Wenn jemand Migrations oder Pakete hinzugefügt hat:

bash
pip install -r requirements.txt
python manage.py migrate
Neue Abhängigkeit hinzufügen
bash
pip install <paket>
pip freeze > requirements.txt

requirements.txt mitcommitten, sonst fehlt das Paket bei allen anderen.

Migrations

Nach Änderungen an models.py:

bash
python manage.py makemigrations
python manage.py migrate

Die erzeugten Dateien in core/migrations/ gehören ins Repo — ohne sie kann niemand die Datenbank nachbauen.

Häufige Probleme

command not found: python3 Auf manchen Systemen heißt es nur python. Version prüfen mit python --version.

CORS-Fehler im Browser Das Frontend muss auf http://localhost:5173 laufen — diese Adresse steht in CORS_ALLOWED_ORIGINS in config/settings.py. Bei einem anderen Port dort ergänzen.

no such table: ... python manage.py migrate vergessen.

Änderungen wirken nicht Prüfen, ob die venv aktiv ist — im Terminal-Prompt sollte (.venv) stehen.