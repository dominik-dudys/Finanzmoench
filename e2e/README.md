# E2E-Tests (Playwright)

End-to-End-Tests für Finanzmönch mit [Playwright](https://playwright.dev). Die Tests decken die wichtigsten Abläufe der App ab, von Registrierung und Login über Haushalte und Finanzen bis zu JeremyAI und Premium.

Die Tests laufen gegen eine eigene SQLite-Datenbank, die bei jedem Lauf neu befüllt wird. E-Mails werden von Mailpit abgefangen, externe Dienste (Gemini, Fish Audio, Stripe) werden gemockt.

## Voraussetzungen

- Node.js >= 20
- Python mit installierten Backend-Abhängigkeiten
- Docker (für Mailpit)
- Installierte Frontend-Abhängigkeiten (`npm install` in `frontend/`)

## Installation

```bash
cd e2e
npm install
npx playwright install chromium
```

## Mailpit starten

```bash
npm run mail:up      # starten
npm run mail:down    # stoppen
```

Die Weboberfläche ist unter http://localhost:8025 erreichbar.

## Tests ausführen

Laufende Dev-Server auf den Ports `8000` und `5173` vorher beenden. Playwright startet Backend und Frontend selbst.

```bash
npm test                                   # alle Tests
npx playwright test -c playwright.ci.config.ts   # nur Kerntests (wie in der CI)
npm run test:ui                            # interaktive UI
npm run test:headed                        # mit sichtbarem Browser
npx playwright test tests/<ordner>         # einzelner Bereich
npx playwright test -g "<testname>"        # nach Namen filtern
npm run report                             # HTML-Report des letzten Laufs
```

## Funktionsweise

Beim Start eines Testlaufs:

1. wird geprüft, ob Mailpit erreichbar ist,
2. startet das Backend mit `config.settings_e2e`, migriert, leert und befüllt die Datenbank (`seed_e2e`),
3. startet das Frontend,
4. werden alle Test-Personen einmal angemeldet und ihre Sessions für die Tests gespeichert.

**`settings_e2e.py`** erbt von den normalen Settings und stellt auf SQLite, Mailpit als SMTP-Server und Dummy-Stripe-Keys um. Rate-Limits sind deaktiviert.

**`seed_e2e`** legt feste Testdaten an (Personen, Haushalte, Kosten, Einnahmen, Feature-Flags, Abos). Jeder Testbereich hat eigene Personen und Haushalte, damit sich Tests nicht gegenseitig beeinflussen. Alle Test-Accounts nutzen `@e2e.test`-Adressen und das Passwort `E2e-Passwort-123!`.

## CI

Der Workflow `.github/workflows/e2e.yml` läuft bei jedem Push auf `main`. Er führt die Kerntests aus `playwright.ci.config.ts` parallel aus, mit Mailpit als Service-Container und Dummy-Keys für externe APIs. Der Playwright-Report wird als Artefakt hochgeladen.

## Umgebungsvariablen

| Variable | Zweck |
|---|---|
| `E2E_PYTHON` | Pfad zum Python-Interpreter (Standard: venv im Ordner `backend/`) |
| `SECRET_KEY_BE` | Django-Secret-Key (Standard: Testwert) |
| `MAILPIT_URL` | Adresse von Mailpit (Standard: `http://localhost:8025`) |

## Projektstruktur

```
docker-compose.e2e.yaml           # Mailpit
.github/workflows/e2e.yml         # CI-Workflow
backend/
├── config/settings_e2e.py        # Settings für E2E
└── accounts/management/commands/seed_e2e.py
e2e/
├── playwright.config.ts          # Konfiguration (alle Tests)
├── playwright.ci.config.ts       # Konfiguration (Kerntests)
├── global-setup.ts
├── helpers/                      # Login, Mailpit, Test-Personen, 2FA
└── tests/                        # Tests nach Bereich
```

## Troubleshooting

| Problem | Lösung |
|---|---|
| Mailpit nicht erreichbar | Docker starten, `npm run mail:up` |
| Port belegt | Laufende Dev-Server beenden |
| `ECONNREFUSED ::1:8000` | Backend bzw. Vite-Proxy auf `127.0.0.1:8000` statt `localhost` umstellen |
| Falsches Python | `E2E_PYTHON` setzen |
| Test schlägt fehl | `npm run report` öffnen (Screenshot, Video und Trace pro Fehler) |
