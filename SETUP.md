# Setup

Anleitung, um Finanzmönch zu betreiben. Die komplette Anwendung läuft in Docker.
Für die End-to-End-Tests siehe [README.md](e2e/README.md).

## Überblick

`docker compose` startet drei Container:

| Container | Inhalt | Port |
|---|---|---|
| `db` | MySQL 8 | `127.0.0.1:3306` |
| `web` | Django 6.1 + Django REST Framework, allauth (headless), Gunicorn | `127.0.0.1:8000` |
| `nginx` | liefert das gebaute React-Frontend (React 19 + Vite + TypeScript) aus und leitet `/api`, `/admin`, `/accounts` an `web` weiter | `80` / `443` |

## Voraussetzungen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) bzw. Docker Engine mit Docker Compose
- Git

Nur für die [lokale Entwicklung ohne Docker](#lokale-entwicklung-ohne-docker-optional) und die E2E-Tests:

- [Python 3.13](https://www.python.org/downloads/)
- [Node.js 24](https://nodejs.org/) (siehe `frontend/.nvmrc`)
- Optional: [Stripe CLI](https://docs.stripe.com/stripe-cli) zum Testen von Webhooks

## 1. Repository klonen

```bash
git clone https://github.com/dominik-dudys/Finanzmoench Finanzmoench
cd Finanzmoench
```

## 2. Umgebungsvariablen

Alle Variablen stehen in **einer** `.env` im Projekt-Root (nicht in `backend/`). Docker Compose
lädt sie über `env_file`, Django über `load_dotenv(BASE_DIR.parent / ".env")`.

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

# Login- und Bestätigungscodes erscheinen im Log des web-Containers statt per Mail
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# nginx ohne TLS
NGINX_CONF=default.dev.conf
CERT_PATH=./nginx/certs

# Frontend wird von nginx auf Port 80 ausgeliefert
FRONTEND_URL=http://localhost
LOGIN_REDIRECT_URL=http://localhost/auth/callback
```

Secret Key erzeugen (alternativ einen beliebigen langen Zufallsstring verwenden):

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

> Im Container setzt `docker-compose.yaml` `DB_HOST=db` automatisch. `127.0.0.1` in der `.env`
> gilt nur für Werkzeuge außerhalb von Docker (lokale Entwicklung, IDE). Dort muss es `127.0.0.1`
> sein, nicht `localhost`, sonst versucht der MySQL-Treiber einen Socket.

### Alle Variablen

| Variable | Pflicht | Default | Zweck |
|---|---|---|---|
| `SECRET_KEY_BE` | ja | – | Django Secret Key, ohne Wert startet das Backend nicht |
| `DEBUG` | nein | `0` | `1` für Entwicklung |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | ja | – | MySQL-Datenbank und -Benutzer |
| `DB_ROOT_PASSWORD` | ja | – | Root-Passwort des MySQL-Containers |
| `DB_HOST`, `DB_PORT` | ja | – | `127.0.0.1` / `3306` (im Container automatisch `db`) |
| `NGINX_CONF` | ja | – | `default.dev.conf` lokal, `default.prod.conf` auf dem Server |
| `CERT_PATH` | ja | – | `./nginx/certs` lokal, `/etc/letsencrypt` auf dem Server |
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

## 3. Starten

Docker Desktop muss laufen.

```bash
docker compose up -d --build
docker compose ps          # alle Container "running", db "healthy"
```

Beim Start führt der `web`-Container automatisch `migrate` und `collectstatic` aus und startet
danach Gunicorn. Beim allerersten Start braucht MySQL rund 20 Sekunden, bis es Verbindungen
annimmt; `web` wartet darauf.

| URL | Inhalt |
|---|---|
| http://localhost/ | Anwendung |
| http://localhost/admin/ | Admin-Dashboard |
| http://localhost/api/docs/ | Swagger UI |
| http://localhost/api/schema/ | OpenAPI-Schema |

## 4. Superuser und Admin-Dashboard

Für den Zugang zum Admin-Dashboard wird ein Superuser mit dem Django-Befehl
`createsuperuser` angelegt:

```bash
docker compose exec web python manage.py createsuperuser
```

Der Befehl fragt nacheinander die Zugangsdaten (u. a. E-Mail und Passwort) ab. Mit genau diesen
Daten meldet man sich anschließend unter http://localhost/admin/ im Admin-Dashboard an.
Dort lassen sich alle Daten einsehen und bearbeiten, z. B. Benutzer, Haushalte und Feature-Flags.

## 5. Feature-Flags anlegen

Nach einem frischen Setup existieren keine Feature-Flags, unbekannte Flags gelten als
deaktiviert. Im Admin-Dashboard (mit dem Superuser angemeldet) unter **Feature Flags** anlegen,
jeweils mit `enabled` aktiv und `rollout_percent = 100`:

| Flag | Schaltet frei |
|---|---|
| `jeremy_ai` | KI-Assistent JeremyAI |
| `two_factor` | Einrichtung der Zwei-Faktor-Anmeldung |

## 6. Erster Login

Die Registrierung verlangt eine bestätigte E-Mail-Adresse, und der Passwort-Login fragt
zusätzlich einen Code ab. Mit dem Console-Backend stehen beide Codes im Log:

```bash
docker compose logs -f web
```

## Betrieb

### Starten und Stoppen

Die Container starten nach einem Neustart des Rechners nicht von selbst.

```bash
docker compose up -d       # starten
docker compose stop        # stoppen
docker compose logs -f     # Logs aller Container
```

### Nach einem `git pull`

```bash
docker compose up -d --build
```

Images werden neu gebaut, neue Migrations spielt der `web`-Container beim Start automatisch ein.

### Datenbank

Die Daten liegen im Docker-Volume `mysqldata` und überleben `docker compose down`.

Verbindung prüfen:

```bash
docker compose exec web python manage.py shell -c "
from django.db import connection
print('Engine:', connection.vendor)
print('Datenbank:', connection.settings_dict['NAME'])
cur = connection.cursor()
cur.execute('SELECT VERSION()')
print('Server:', cur.fetchone()[0])
"
```

Erwartet: `Engine: mysql`, `Datenbank: finanzmoench`, `Server: 8.x.x`

In die Datenbank schauen (Passwort aus der `.env`):

```bash
docker compose exec db mysql -u finanzmoench -p finanzmoench
```

Dann z. B. `SHOW TABLES;`, verlassen mit `exit`. Alternativ mit einem Datenbank-Client wie dem
Datenbank-Tab in IntelliJ/PyCharm: Host `127.0.0.1`, Port `3306`, Datenbank `finanzmoench`,
Zugangsdaten aus der `.env`.

Datenbank komplett zurücksetzen (löscht alle Daten):

```bash
docker compose down -v
docker compose up -d --build
docker compose exec web python manage.py createsuperuser
```

Danach Feature-Flags erneut anlegen.

## Externe Dienste (optional)

### Stripe (Premium)

Werte aus dem Stripe-Dashboard im **Testmodus** in die `.env` eintragen und
`docker compose up -d` erneut ausführen. Webhooks lokal weiterleiten:

```bash
stripe listen --forward-to localhost/api/payment/webhook/
```

Das ausgegebene `whsec_…` als `STRIPE_WEBHOOK_SECRET` eintragen. Testkarte:
`4242 4242 4242 4242`, beliebiges zukünftiges Ablaufdatum und beliebige Prüfnummer.

### Google / GitHub OAuth

OAuth-App beim Anbieter anlegen und als Callback-URL eintragen:

- `http://localhost/accounts/google/login/callback/`
- `http://localhost/accounts/github/login/callback/`

### JeremyAI

`GEMINI_API_KEY` aus [Google AI Studio](https://aistudio.google.com/) sowie `FISH_API_KEY` und
`FISH_VOICE_ID` von [Fish Audio](https://fish.audio/) eintragen und das Flag `jeremy_ai` aktivieren.

## Lokale Entwicklung ohne Docker (optional)

Für die Entwicklung mit Hot Reload laufen Backend und Frontend direkt auf dem Rechner, nur die
Datenbank bleibt in Docker. In der `.env` dafür `FRONTEND_URL` und `LOGIN_REDIRECT_URL`
entfernen (Defaults zeigen auf Port `5173`).

```bash
docker compose up -d db
```

Backend:

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

Frontend, in einem zweiten Terminal:

```bash
cd frontend
npm install
npm run dev
```

Die App läuft dann auf http://localhost:5173, das Admin-Dashboard auf
http://localhost:8000/admin/. Vite leitet `/api` und `/accounts` an `http://localhost:8000`
weiter. Das Backend erlaubt CORS/CSRF fest für `http://localhost:5173`, das Frontend daher über
genau diese Adresse öffnen, nicht über `127.0.0.1`.

Weitere Skripte: `npm run build`, `npm run lint`, `npm run typecheck`, `npm run format`.

## Häufige Probleme

| Problem | Lösung |
|---|---|
| `Can't connect to MySQL server` | Container läuft nicht oder startet noch: `docker compose up -d`, mit `docker compose ps` prüfen, ggf. kurz warten |
| `Access denied for user` | Die Zugangsdaten in der `.env` weichen von denen ab, mit denen das Volume angelegt wurde. Neu aufsetzen: `docker compose down -v`, dann `docker compose up -d --build` |
| `KeyError: 'SECRET_KEY_BE'` oder `'NoneType' object has no attribute 'startswith'` | Die `.env` wird nicht gefunden oder ist unvollständig. Sie muss im Projekt-Root liegen, nicht in `backend/` |
| Port `80` belegt | Anderen Webserver (z. B. IIS, Apache, Skype) beenden |
| Port `3306` belegt | Es läuft bereits ein lokales MySQL. Dieses stoppen oder in `docker-compose.yaml` das Port-Mapping auf `127.0.0.1:3307:3306` und in der `.env` `DB_PORT=3307` setzen |
| Port `8000` oder `5173` belegt (lokale Entwicklung) | Alten `runserver` bzw. `npm run dev` beenden |

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
