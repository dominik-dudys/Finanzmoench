# E2E-Tests (Playwright)

End-to-End-Tests für Finanzmönch mit [Playwright](https://playwright.dev). 126 Tests in 20 Dateien decken Auth (Login, Registrierung, 2FA, Passwort), Haushalt, Kategorien, Kosten, Einnahmen, Dashboard, Profil, JeremyAI und Premium/Stripe ab.

Die Tests laufen gegen eine eigene SQLite-Datenbank (`backend/e2e.sqlite3`), die bei jedem Lauf neu befüllt wird. Mails landen in Mailpit, Gemini, Fish Audio und Stripe werden im Browser gemockt.

## Voraussetzungen

- Node.js ≥ 20
- Python mit installiertem Backend-venv (`backend/.venv` oder `backend/finanzmoench`)
- Docker Desktop (für Mailpit)
- Frontend-Abhängigkeiten installiert (`cd frontend && npm install`)

## Installation

```bash
cd e2e
npm install
npx playwright install chromium
```

## Mailpit starten

Docker Desktop muss laufen.

```bash
npm run mail:up      # startet Mailpit (SMTP :1025, Web-UI :8025)
npm run mail:down    # stoppt Mailpit
```

Web-UI: http://localhost:8025

## Tests ausführen

Laufende Dev-Server auf Port `8000` und `5173` vorher beenden. Playwright startet Backend und Frontend selbst.

```bash
npm test                               # alle Tests, headless
npm run test:ui                        # interaktive UI
npm run test:headed                    # mit sichtbarem Browser
npm run test:debug                     # Debug-Modus
npx playwright test tests/costs        # einzelner Ordner
npx playwright test -g "Kostenposten"  # nach Testnamen filtern
npm run report                         # HTML-Report des letzten Laufs
```

## Ablauf eines Testlaufs

1. `global-setup.ts` prüft, ob Mailpit erreichbar ist, und leert das Postfach.
2. Das Backend startet mit `DJANGO_SETTINGS_MODULE=config.settings_e2e` und führt aus:
   `migrate` → `flush` → `seed_e2e` → `runserver 8000`
3. Das Frontend startet mit `npm run dev` auf Port `5173`.
4. `tests/setup/auth.setup.ts` meldet alle Test-Personen per E-Mail-Code an und speichert die Sessions in `e2e/.auth/`.
5. Die Tests laufen in Chromium, seriell mit einem Worker.

### `settings_e2e.py`

Erbt von `config/settings.py` und überschreibt:

| Einstellung | Wert |
|---|---|
| Datenbank | SQLite `backend/e2e.sqlite3` |
| E-Mail | SMTP an `127.0.0.1:1025` (Mailpit) |
| Rate-Limits (allauth) | deaktiviert |
| Stripe-Keys | Dummy-Werte |

### `seed_e2e`

Management-Command (`backend/accounts/management/commands/seed_e2e.py`), der feste Haushalte, Test-Personen, Kosten, Einnahmen, Feature-Flags und Abos anlegt. Jede Testdatei nutzt eigene Personen und Haushalte, damit sich Tests nicht gegenseitig beeinflussen.

- E-Mail: `<name>@e2e.test`
- Passwort: `E2e-Passwort-123!`

## Umgebungsvariablen

| Variable | Zweck | Standard |
|---|---|---|
| `E2E_PYTHON` | Pfad zum Python-Interpreter | sucht in `backend/.venv` und `backend/finanzmoench` |
| `SECRET_KEY_BE` | Django-Secret-Key | `e2e-secret-key-nur-fuer-lokale-tests` |
| `CI` | aktiviert Retries und `forbidOnly` | – |

```powershell
$env:E2E_PYTHON="C:\Pfad\zum\venv\Scripts\python.exe"; npm test
```

## Projektstruktur

```
docker-compose.e2e.yaml              # Mailpit
backend/
├── config/settings_e2e.py           # Django-Settings für E2E
└── accounts/management/commands/
    └── seed_e2e.py                  # Testdaten
e2e/
├── package.json
├── playwright.config.ts             # Config inkl. Webserver-Start
├── global-setup.ts                  # Mailpit-Check
├── helpers/
│   ├── auth.ts                      # Login per E-Mail-Code
│   ├── mailpit.ts                   # Mailpit-API
│   ├── personas.ts                  # Test-Personen
│   └── totp.ts                      # 2FA-Codes
└── tests/
    ├── setup/                       # Login aller Personen
    ├── public/                      # Startseite, geschützte Routen
    ├── auth/                        # Login, Registrierung, 2FA, Passwort vergessen
    ├── household/                   # Erstellen, Beitreten, Bearbeiten, Verlassen/Auflösen
    ├── categories/
    ├── costs/
    ├── incomes/
    ├── dashboard/
    ├── profile/
    ├── settings/                    # Passwort, KI-Einwilligung
    ├── jeremy/
    └── payment/
```

## Troubleshooting

| Problem | Lösung |
|---|---|
| `Mailpit ist ... nicht erreichbar` | Docker Desktop starten, `npm run mail:up` |
| Port belegt | Alten `runserver` / `npm run dev` beenden |
| `ECONNREFUSED ::1:8000` | In `playwright.config.ts` `runserver localhost:8000` verwenden oder Vite-Proxy auf `http://127.0.0.1:8000` setzen |
| Falsches Python | `E2E_PYTHON` setzen |
| Test schlägt fehl | `npm run report`: Screenshot, Video und Trace pro Fehler |
