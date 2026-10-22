# Setup

Anleitung, um Finanzmönch lokal zu betreiben. Für die End-to-End-Tests siehe [README.md](e2e/README.md).

## Überblick

| Komponente | Technik | Port lokal |
|---|---|---|
| Backend | Django 6.1 + Django REST Framework, allauth (headless) | `8000` |
| Frontend | React 19 + Vite + TypeScript | `5173` |
| Datenbank | MySQL 8 (Docker) | `3306` |
| Webserver (nur Docker-Stack) | nginx, liefert Frontend aus und leitet `/api`, `/admin`, `/accounts` an das Backend | `80` / `443` |

## Voraussetzungen

- [Python 3.13](https://www.python.org/downloads/)
- [Node.js 24](https://nodejs.org/) (siehe `frontend/.nvmrc`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) bzw. Docker Engine mit Docker Compose
- Git
- Optional: [Stripe CLI](https://docs.stripe.com/stripe-cli) zum Testen von Webhooks

## 1. Repository klonen

```bash
git clone https://github.com/dominik-dudys/Finanzmoench Finanzmoench
cd Finanzmoench
```

## 2. Umgebungsvariablen

Alle Variablen stehen in **einer** `.env` im Projekt-Root (nicht in `backend/`). Django lädt sie über
`load_dotenv(BASE_DIR.parent / ".env")`, Docker Compose über `env_file`.

```bash
cp .env.example .env          # Windows: copy .env.example .env
```

### Minimal (reicht zum Starten)

```env
SECRET_KEY_BE=<beliebiger-langer-zufallsstring>
DEBUG=1

DB_NAME=finanzmoench
DB_USER=finanzmoench
DB_PASSWORD=devpassword
DB_ROOT_PASSWORD=rootpassword
DB_HOST=127.0.0.1
DB_PORT=3306

# Login- und Bestätigungscodes erscheinen im Backend-Log statt per Mail
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Wird von docker-compose.yaml immer benötigt, auch wenn nur die DB gestartet wird
NGINX_CONF=default.dev.conf
CERT_PATH=./nginx/certs
```

Secret Key erzeugen:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

> `DB_HOST` muss `127.0.0.1` sein, nicht `localhost` (sonst versucht der MySQL-Treiber einen Socket).
> Im Docker-Stack wird `DB_HOST` automatisch auf `db` gesetzt.

### Alle Variablen

| Variable | Pflicht | Default | Zweck |
|---|---|---|---|
| `SECRET_KEY_BE` | ja | – | Django Secret Key, ohne Wert startet das Backend nicht |
| `DEBUG` | nein | `0` | `1` für Entwicklung |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | ja | – | MySQL-Datenbank und -Benutzer |
| `DB_ROOT_PASSWORD` | ja (Docker) | – | Root-Passwort des MySQL-Containers |
| `DB_HOST`, `DB_PORT` | ja | – | `127.0.0.1` / `3306` |
| `NGINX_CONF` | ja (Docker) | – | `default.dev.conf` lokal, `default.prod.conf` auf dem Server |
| `CERT_PATH` | ja (Docker) | – | `./nginx/certs` lokal, `/etc/letsencrypt` auf dem Server |
| `EMAIL_BACKEND` | nein | SMTP (IONOS) | lokal Console-Backend, siehe oben |
| `IONOS_MAIL`, `IONOS_PASSWORD` | für Mailversand | – | SMTP-Zugang (`smtp.ionos.de:587`, TLS) |
| `DJANGO_LOG_LEVEL` | nein | `DEBUG` | Log-Level |
| `FRONTEND_URL` | nein | `http://localhost:5173` | Rücksprung-URL nach Stripe Checkout |
| `LOGIN_REDIRECT_URL` | nein | `http://localhost:5173/auth/callback` | Weiterleitung nach Social Login |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | nein | leer | Login mit Google |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | nein | leer | Login mit GitHub |
| `GEMINI_API_KEY` | nein | – | JeremyAI (Google Gemini) |
| `FISH_API_KEY`, `FISH_VOICE_ID` | nein | – | Sprachausgabe von Jeremy (Fish Audio) |
| `STRIPE_PRIVATE_KEY` | nein | leer | Stripe Secret Key (`sk_test_…`) |
| `STRIPE_PRICE_ID_PREMIUM` | nein | leer | Preis-ID des Premium-Abos (`price_…`) |
| `STRIPE_WEBHOOK_SECRET` | nein | leer | Webhook-Signatur (`whsec_…`) |

Optionale Variablen ohne Wert verhindern den Start nicht. Nur die jeweilige Funktion
(Social Login, JeremyAI, Premium-Checkout) liefert dann beim Aufruf einen Fehler.

## 3. Datenbank starten

```bash
docker compose up -d db
```

MySQL läuft danach auf `127.0.0.1:3306`, die Daten liegen im Volume `mysqldata`.

## 4. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

| URL | Inhalt |
|---|---|
| http://localhost:8000/admin/ | Admin-Backend |
| http://localhost:8000/api/docs/ | Swagger UI |
| http://localhost:8000/api/schema/ | OpenAPI-Schema |

### Superuser und Admin-Dashboard

Für den Zugang zum Admin-Dashboard wird lokal ein Superuser mit dem Django-Befehl
`createsuperuser` angelegt (im Ordner `backend/`, mit aktivierter venv):

```bash
python manage.py createsuperuser
```

Der Befehl fragt nacheinander die Zugangsdaten (u. a. E-Mail und Passwort) ab. Mit genau diesen
Daten meldet man sich anschließend unter http://localhost:8000/admin/ im Admin-Dashboard an.
Dort lassen sich alle Daten einsehen und bearbeiten, z. B. Benutzer, Haushalte und Feature-Flags.

Im Docker-Stack wird der Befehl im Container ausgeführt
(`docker compose exec web python manage.py createsuperuser`), das Dashboard liegt dann unter
http://localhost/admin/.

### Feature-Flags anlegen

Nach einem frischen Setup existieren keine Feature-Flags, unbekannte Flags gelten als
deaktiviert. Im Admin-Dashboard (mit dem Superuser angemeldet) unter **Feature Flags** anlegen, jeweils mit `enabled` aktiv und
`rollout_percent = 100`:

| Flag | Schaltet frei |
|---|---|
| `jeremy_ai` | KI-Assistent JeremyAI |
| `two_factor` | Einrichtung der Zwei-Faktor-Anmeldung |

## 5. Frontend

In einem zweiten Terminal:

```bash
cd frontend
npm install
npm run dev
```

Die App läuft auf http://localhost:5173. Vite leitet `/api` und `/accounts` an
`http://localhost:8000` weiter, eigene `VITE_`-Variablen sind nicht nötig.

> Das Backend erlaubt CORS/CSRF fest für `http://localhost:5173`. Das Frontend daher über
> genau diese Adresse öffnen, nicht über `127.0.0.1`.

Weitere Skripte: `npm run build`, `npm run lint`, `npm run typecheck`, `npm run format`.

### Erster Login

Die Registrierung verlangt eine bestätigte E-Mail-Adresse, und der Passwort-Login fragt
zusätzlich einen Code ab. Mit dem Console-Backend stehen beide Codes im Terminal von
`runserver`.

## Kompletter Stack mit Docker

Alternativ laufen Datenbank, Backend (Gunicorn) und nginx mit dem gebauten Frontend
zusammen in Docker:

```bash
docker compose up -d --build
docker compose exec web python manage.py createsuperuser
```

Der `web`-Container führt beim Start `migrate` und `collectstatic` aus. nginx ist auf Port `80`
erreichbar (`NGINX_CONF=default.dev.conf`, ohne TLS). Danach Feature-Flags wie oben anlegen.

Datenbank zurücksetzen (löscht alle Daten):

```bash
docker compose down -v
```

## Externe Dienste (optional)

### Stripe (Premium)

Werte aus dem Stripe-Dashboard im **Testmodus** in die `.env` eintragen. Webhooks lokal
weiterleiten:

```bash
stripe listen --forward-to localhost:8000/api/payment/webhook/
```

Das ausgegebene `whsec_…` als `STRIPE_WEBHOOK_SECRET` eintragen. Testkarte:
`4242 4242 4242 4242`, beliebiges zukünftiges Ablaufdatum und beliebige Prüfnummer.

### Google / GitHub OAuth

OAuth-App beim Anbieter anlegen und als Callback-URL eintragen:

- `http://localhost:5173/accounts/google/login/callback/`
- `http://localhost:5173/accounts/github/login/callback/`

### JeremyAI

`GEMINI_API_KEY` aus [Google AI Studio](https://aistudio.google.com/) sowie `FISH_API_KEY` und
`FISH_VOICE_ID` von [Fish Audio](https://fish.audio/) eintragen und das Flag `jeremy_ai` aktivieren.

## Tests

- **Automatisierte Tests beim Deployment:** siehe [e2e.yml](.github/workflows/e2e.yml)
- **End-to-End (Playwright):** siehe [README.md](e2e/README.md)

## Deployment

Die Pipeline `.github/workflows/deploy.yml` läuft bei jedem Push und Pull Request auf `main`
(Lint, Typecheck, Build, `manage.py check --deploy` und Tests gegen MySQL). Bei einem Push auf
`main` deployt sie anschließend per SSH auf den Server:

```bash
git pull origin main --ff-only
docker compose build
docker compose up -d --wait db
docker compose run --rm --no-deps web python manage.py migrate --noinput
docker compose up -d --wait --remove-orphans
```

Benötigte GitHub-Secrets: `SECRET_KEY_BE`, `SERVER_IP`, `SERVER_USER`, `SERVER_SSH_KEY`.
Auf dem Server liegt das Repository unter `~/Finanzmoench` mit einer `.env` mit
Produktionswerten (`NGINX_CONF=default.prod.conf`, `CERT_PATH=/etc/letsencrypt`).
