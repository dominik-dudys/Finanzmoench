<p align="center">
  <img src="frontend/public/finanzmoench-logo-text-transparent.png" alt="Finanzmönch" width="420">
</p>

<p align="center">
  <b>Was bleibt am Monatsende übrig?</b><br>
  Fixkosten im gemeinsamen Haushalt fair aufteilen und auf einen Blick sehen, was jedem frei zur Verfügung steht.
</p>

<p align="center">
  <a href="https://finanzmönch.de">finanzmönch.de</a> ·
  <a href="https://www.youtube.com/watch?v=yMbmwPXL708">Video</a> ·
  <a href="SETUP.md">Setup</a> ·
  <a href="e2e/README.md">E2E-Tests</a> ·
  <a href="https://finanzmönch.de/api/docs/">API-Dokumentation</a>
</p>

---

## Worum es geht

„Wer zahlt diesen Monat eigentlich den Strom?“ In WGs, bei Paaren und in Familien verteilen sich
Miete, Strom, Versicherungen und Abos auf mehrere Personen. Meist landet das in einer
Excel-Tabelle oder auf einem Notizzettel, und am Monatsende weiß trotzdem niemand genau, wie
viel Geld noch übrig ist.

Finanzmönch rechnet das für den ganzen Haushalt aus:

```
Einkommen aller Mitglieder  −  Fixkosten, fair aufgeteilt  =  was jedem pro Monat bleibt
```

Die Anwendung ist als Projekt im Modul „Angewandte Business-Application-Entwicklung in der
Cloud“ an der Leibniz-FH Hannover entstanden (Gruppe 2) und läuft öffentlich unter
[finanzmönch.de](https://finanzmönch.de).

> **Hinweis:** Der Server ist voraussichtlich bis zum **27.12.2026** unter
> [finanzmönch.de](https://finanzmönch.de) erreichbar.

## Video

Der Screencast mit Voice-Over geht einmal durch die Anwendung und zeigt alle Pflicht-Features
sowie die gewählten Wahlpflicht-Features:

**[▶ Finanzmönch – Video-Rundgang auf YouTube](https://www.youtube.com/watch?v=yMbmwPXL708)**

[![Finanzmönch – Video-Rundgang](https://img.youtube.com/vi/yMbmwPXL708/hqdefault.jpg)](https://www.youtube.com/watch?v=yMbmwPXL708)

## Warum Finanzmönch?

- **Für Haushalte gebaut, nicht für Einzelpersonen.** Mehrere Personen teilen sich einen
  Haushalt. Jeder Kostenposten wird prozentual auf die Mitglieder verteilt, und das Dashboard
  zeigt pro Person, was nach den eigenen Anteilen übrig bleibt.
- **Die Vergangenheit bleibt richtig.** Steigt die Miete, wird der alte Betrag nicht
  überschrieben. Jede Änderung entsteht als neue Version mit Gültigkeitszeitraum, damit
  frühere Monate weiterhin korrekt berechnet werden.
- **Ein Finanzcoach, der die eigenen Zahlen kennt.** JeremyAI bekommt Einkommen und Fixkosten
  des Haushalts als Kontext, beantwortet Fragen dazu per Google Gemini und liest die Antwort
  mit eigener Stimme vor.
- **Sicher ab dem ersten Login.** Registrierung nur mit bestätigter E-Mail-Adresse, Login mit
  zusätzlichem E-Mail-Code, optional Zwei-Faktor-Authentifizierung per Authenticator-App oder
  Login mit Google bzw. GitHub.
- **Datenschutz eingebaut.** Alle eigenen Daten lassen sich als JSON oder CSV herunterladen,
  das Konto lässt sich selbst löschen. Gemeinsame Kosten werden dabei automatisch auf die
  übrigen Mitglieder umgelegt.
- **Freemium mit echtem Bezahlvorgang.** Die Grundfunktionen sind kostenlos. Premium
  (4,99 € / Monat) erhöht das Tageskontingent für JeremyAI und wird über Stripe abgerechnet,
  ohne dass Kartendaten den eigenen Server berühren.
- **Automatisch getestet und ausgeliefert.** Jeder Push auf `main` durchläuft Lint, Typecheck,
  Build, Backend-Checks und Playwright-Browsertests. Danach wird automatisch auf den Server
  deployt.

## Funktionen

### Konto und Sicherheit

- Registrierung mit Vorname, Nachname, E-Mail und Passwort, Bestätigung per 6-stelligem Code
- Login mit Passwort und anschließendem E-Mail-Code
- Login mit Google oder GitHub (OAuth2), Konten lassen sich in den Einstellungen verknüpfen und trennen
- Zwei-Faktor-Authentifizierung (TOTP) mit QR-Code und Wiederherstellungscodes; ist sie aktiv,
  ersetzt der Authenticator-Code den E-Mail-Code. Für Google/GitHub-Logins übernimmt der
  Anbieter die Absicherung
- Passwort vergessen per Code, Passwort ändern
- Erneute Bestätigung (Re-Authentifizierung) vor sicherheitskritischen Änderungen
- Sitzung endet beim Schließen des Browsers, spätestens nach 8 Stunden
- Bestätigungs- und Login-Mails auf Deutsch über den IONOS-Mailserver

### Haushalt

- Haushalt anlegen mit Name, Adresse, PLZ, Ort und Währung (EUR oder USD), mit Prüfung der Eingaben
- Beitritt über die Haushalts-ID: Die Anfrage muss von einem Mitglied angenommen werden
- Offene Anfragen annehmen oder ablehnen, eigene Anfragen einsehen
- Haushalt bearbeiten, verlassen oder auflösen. Verlässt das letzte Mitglied den Haushalt, wird
  er aufgelöst; sonst werden die Kostenanteile auf die Verbleibenden umgerechnet
- Jeder neue Haushalt bekommt sieben Standard-Kategorien (z. B. Gehalt, Miete & Nebenkosten,
  Lebensmittel)

### Kosten und Verträge

- Kostenposten mit Betrag, Kategorie, Beschreibung und Intervall (täglich, wöchentlich,
  monatlich, jährlich)
- Aufteilung in Prozent auf die Haushaltsmitglieder, die Summe muss genau 100 % ergeben;
  „gleichmäßig aufteilen“ per Klick
- Verträge: Kostenposten mit Start- und Enddatum, eigener Tab mit Laufzeit
- Berechnung der nächsten Fälligkeit, auch für Sonderfälle wie den 31. in einem 30-Tage-Monat
- Versionierung: Ändern sich Betrag oder Aufteilung, wird die alte Version beendet und eine neue
  angelegt (`valid_from` / `valid_until`, gemeinsame `history_group_id`)
- Archivieren statt Löschen, damit vergangene Monate erhalten bleiben
- Über die API zusätzlich: alle Kosten auf einmal gleichmäßig, individuell oder **fair nach
  Einkommen** aufteilen (`POST /api/finances/global-shares/`), wahlweise ohne bestimmte
  Einkommensarten wie Kindergeld

### Einkommen und Kategorien

- Einkommen pro Person mit Kategorie, ebenfalls versioniert und archivierbar
- Rückblick auf archivierte Einkommen (letzter Monat, letzte 3 Monate, letztes Jahr)
- Eigene Kategorien für Einnahmen und Ausgaben mit Farbcode; Standard-Kategorien sind geschützt
- Beim Löschen einer genutzten Kategorie werden alle Einträge auf eine Ersatzkategorie verschoben

### Dashboard

- Kennzahlen: Fixkosten pro Monat mit Veränderung zum Vormonat, Hochrechnung aufs Jahr,
  Überschuss mit Ausgabenquote, nächste Zahlung
- Verlauf von Fixkosten und Einnahmen über die letzten 6 Monate
- Kosten nach Kategorie
- Pro Person: Einkommen, eigener Kostenanteil und frei verfügbarer Betrag
- Liste der nächsten Zahlungen
- Alle Intervalle werden auf Monatsbeträge umgerechnet

### JeremyAI, der KI-Finanzcoach

- Fragen zu den eigenen Finanzen im Chat stellen; Jeremy bekommt die aktuellen Einkommen,
  Kosten und Anteile des Haushalts als Kontext
- Antworten über Google Gemini, Sprachausgabe als MP3 über Fish Audio
- Chatverläufe werden gespeichert, können fortgesetzt und gelöscht werden
- Zwei Persönlichkeiten: seriöser Coach oder Satire-Modus (deutlich als „nicht ernst gemeint,
  keine Finanzberatung“ gekennzeichnet)
- Nutzung nur nach ausdrücklicher KI-Einwilligung, jederzeit widerrufbar
- Tageskontingent: 2 Fragen (Free) bzw. 10 Fragen (Premium), Reset um Mitternacht (Europe/Berlin)
- Schutz im System-Prompt gegen Prompt-Injection und themenfremde Fragen, keine Anlageberatung
- Robust: automatische Wiederholung bei Überlastung von Gemini, Text wird auch ohne Audio
  ausgeliefert

### Premium mit Stripe

- Preisseite und Upgrade direkt aus der App
- Stripe Checkout (gehostete Bezahlseite, Abo-Modus, deutsche Oberfläche)
- Stripe-Kundenportal zum Verwalten und Kündigen; „gekündigt, läuft noch bis …“ wird angezeigt
- Abo-Status wird ausschließlich über signierte Stripe-Webhooks synchronisiert, ungültige
  Signaturen werden abgelehnt
- Klare Fehlercodes, wenn Stripe nicht erreichbar ist

### Datenschutz (DSGVO)

- Datenexport nach Art. 15 und 20 DSGVO als JSON oder als CSV für Excel: Profil, Haushalt,
  Kategorien, Abo, Einkommen, Kostenanteile, KI-Nutzung und Chatverläufe
- Konto löschen nach Art. 17 DSGVO, bestätigt per Passwort bzw. E-Mail-Adresse bei reinen
  Social-Login-Konten. Gemeinsame Kosten werden auf die übrigen Mitglieder umgelegt, verwaiste
  Daten entfernt
- Datenschutzerklärung und Impressum in der App
- Audit-Log im Admin-Bereich für alle Änderungen (Rechenschaftspflicht)

### Admin-Dashboard

- Eigene Startseite mit Kennzahlen: Nutzer, neue Nutzer, Haushalte, aktive Verträge, gesperrte
  Nutzer, Admin-Änderungen, Anteil mit 2FA und mit KI-Einwilligung, Registrierungen der letzten 8 Wochen
- Nutzer suchen, filtern, sperren und entsperren, Spalten für Login-Methode, 2FA und KI-Einwilligung
- Haushalte mit Mitgliedern und Kategorien
- CSV-Export für Nutzer und Haushalte
- Schutz vor Selbstaussperrung: das eigene Konto lässt sich weder sperren noch löschen, Superuser lassen sich nicht sperren
- Nur lesbares Audit-Log mit Zeitraumfilter

### Feature-Flags

- Flags im Admin anlegen und schalten: Hauptschalter, Rollout in Prozent und Freischaltung für
  einzelne Nutzer
- Stabile Zuordnung pro Nutzer über einen SHA-256-Hash, damit Features beim Neuladen nicht „flackern“
- Unbekannte Flags gelten als aus
- Im Einsatz für `jeremy_ai` (JeremyAI) und `two_factor` (Einrichtung der 2FA)

### REST-API

- 39 dokumentierte Endpunkte für Haushalte, Kategorien, Kosten, Einkommen, Dashboard, JeremyAI,
  Payment, Feature-Flags und Konto
- OpenAPI-3-Schema unter `/api/schema/`, interaktive Swagger UI unter `/api/docs/`, beides
  automatisch aus dem Code erzeugt
- Für externe Clients neben der Browser-Session auch per HTTP Basic Auth nutzbar:

```bash
curl -u "mail@example.com:passwort" "https://xn--finanzmnch-kcb.de/api/finances/calculation-dashboard/?month=10&year=2026"
```

## Pflicht- und Wahlpflicht-Features

### Pflicht

| Anforderung | Umsetzung |
|---|---|
| Backend und Web-Frontend | Django REST API (`backend/`), React-Single-Page-App (`frontend/`) |
| Datenbankanbindung | MySQL 8 über das Django-ORM, 20 Migrationen in 6 Apps |
| Nutzerverwaltung | Eigenes User-Modell `Person` (E-Mail als Login), Registrierung mit Bestätigung, Login per Code, Haushalte |
| Tests | Playwright-E2E-Tests der Kernfunktionen (`e2e/`) |
| CI/CD-Pipeline | GitHub Actions: `deploy.yml` (Checks und Deployment), `e2e.yml` (Browsertests) |
| Betrieb unter öffentlicher Domain | eigener Server bei OVH, Domain [finanzmönch.de](https://finanzmönch.de) bei IONOS, HTTPS mit Let's Encrypt, geplant erreichbar bis 27.12.2026 |

### Wahlpflicht (12 von 12 Punkten)

| Feature | Punkte | Umsetzung |
|---|---|---|
| OAuth2-Integration | 1 | Login mit Google und GitHub über django-allauth |
| Zwei-Faktor-Authentifizierung | 1 | TOTP mit QR-Code und Wiederherstellungscodes, per Feature-Flag ausrollbar |
| Payment-Integration | 2 | Stripe Checkout, Kundenportal und Webhooks |
| DSGVO-Funktionen | 1 | Datenexport (JSON/CSV) und Konto löschen |
| Separate API für externe Nutzung | 2 | REST-API mit OpenAPI-Schema, Swagger UI und HTTP Basic Auth |
| KI-Integration | 2 | JeremyAI mit Google Gemini und Sprachausgabe über Fish Audio |
| Backend-Dashboard | 2 | Django-Admin mit Unfold, Kennzahlen, Nutzerverwaltung, CSV-Export, Audit-Log |
| Feature-Flags | 1 | Flags mit Prozent-Rollout und Allowlist, im Frontend und Backend ausgewertet |

## Architektur

```
Browser ──► nginx (Port 80/443)
              ├─ /                       → gebautes React-Frontend
              ├─ /api, /admin, /accounts → Django + Gunicorn (web:8000)
              └─ /static                 → Static Files des Admins
                                              │
                                              └─► MySQL 8 (db:3306)
```

| Container | Image | Aufgabe |
|---|---|---|
| `db` | `mysql:8` | Datenbank, Daten im Volume `mysqldata` |
| `web` | `python:3.13-slim` | Django mit Gunicorn (3 Worker), führt beim Start `migrate` und `collectstatic` aus |
| `nginx` | `node:24-alpine` (Build) → `nginx:alpine` | baut das Frontend und liefert es aus, Reverse Proxy, TLS |

### Angebundene Dienste

| Dienst | Zweck |
|---|---|
| Google Gemini | Antworten von JeremyAI |
| Fish Audio | Sprachausgabe von JeremyAI |
| Stripe | Premium-Abo, Checkout, Kundenportal, Webhooks |
| Google / GitHub | OAuth2-Login |
| IONOS | Domain und E-Mail-Versand (SMTP) |
| OVH | Server (VPS) |

### Backend-Apps

| App | Inhalt |
|---|---|
| `accounts` | User-Modell `Person`, allauth-Adapter, Login-Stages, Profil, DSGVO-Export und -Löschung, Seed-Befehl für E2E-Tests |
| `households` | Haushalte, Kategorien, Beitrittsanfragen |
| `finances` | Einkommen, Kostenposten, Kostenanteile, Versionierung, Dashboard-Berechnung |
| `voice_ai` | JeremyAI: Gemini, Fish Audio, Chatverläufe, Tageskontingent |
| `payment` | Stripe-Abo, Checkout, Portal, Webhook |
| `feature_flags` | Feature-Flags mit Rollout |
| `core` | Admin-Dashboard, Audit-Log, CSV-Export |

## Verwendete Frameworks und Bibliotheken

### Backend (`backend/requirements.txt`)

| Bibliothek | Version | Wofür |
|---|---|---|
| Python | 3.13 | Laufzeit |
| Django | 6.1 | Web-Framework, ORM, Migrationen, Admin |
| Django REST Framework | 3.18.0 | REST-API |
| django-allauth (`mfa`, `socialaccount`, `headless`) | 65.19.2 | Registrierung, Login per Code, 2FA, Google/GitHub-OAuth, Auth-API für das React-Frontend |
| django-unfold | 0.108.0 | Oberfläche und Dashboard des Admin-Bereichs |
| drf-spectacular | nicht gepinnt | OpenAPI-Schema und Swagger UI |
| django-filter | nicht gepinnt | Filter für die API |
| django-cors-headers | 4.9.0 | CORS für den Vite-Dev-Server |
| PyMySQL | 1.2.0 | MySQL-Treiber |
| python-dotenv | 1.2.3 | lädt die `.env` |
| gunicorn | ≥ 22 | WSGI-Server im Container |
| google-genai | nicht gepinnt | Google-Gemini-SDK für JeremyAI |
| requests | nicht gepinnt | Aufruf der Fish-Audio-API |
| stripe | nicht gepinnt | Stripe-SDK |

### Frontend (`frontend/package.json`)

| Bibliothek | Version | Wofür |
|---|---|---|
| React, React DOM | 19.2 | Oberfläche |
| TypeScript | 6.0 | Typisierung |
| Vite (+ `@vitejs/plugin-react`) | 8.2 | Dev-Server mit Proxy zum Backend, Build |
| React Router | 8.3 | Routing, geschützte Routen |
| TanStack Query | 5.102 | Laden und Cachen der API-Daten |
| Axios | 1.20 | HTTP-Client mit CSRF-Header |
| React Hook Form, Zod, `@hookform/resolvers` | 7.87 / 4.5 / 5.9 | Formulare und Validierung |
| Tailwind CSS (+ `@tailwindcss/vite`, `tw-animate-css`) | 4.3 | Styling |
| shadcn/ui (`shadcn`, `@shadcn/react`) auf Base UI (`@base-ui/react`) | 4.20 / 0.3 / 1.7 | UI-Komponenten wie Dialoge, Menüs, Auswahlfelder, Chat |
| `class-variance-authority`, `clsx`, `tailwind-merge`, `cn` | – | Hilfen für CSS-Klassen |
| Recharts | 3.8 | Diagramme im Dashboard |
| lucide-react | 1.40 | Icons |
| sonner (+ `next-themes`) | 2.0 | Toast-Meldungen |
| input-otp | 1.5 | Eingabe der 6-stelligen Codes |
| react-qr-code | 2.2 | QR-Code bei der 2FA-Einrichtung |
| `@fontsource-variable/geist` | 5.3 | Schriftart |
| i18next, react-i18next, `i18next-browser-languagedetector` | 26.4 / 17.0 / 8.2 | Grundgerüst für Mehrsprachigkeit (Deutsch, Englisch) |
| ESLint (+ `typescript-eslint`, React-Hooks- und React-Refresh-Plugin), Prettier | 10.9 / 3.9 | Linting und Formatierung |

### Tests

| Werkzeug | Version | Wofür |
|---|---|---|
| Playwright (`@playwright/test`) | 1.64 | End-to-End-Tests im Browser (Chromium) |
| Mailpit | `latest` | fängt Bestätigungs- und Login-Mails in den Tests ab |
| SQLite | – | eigene Testdatenbank (`config/settings_e2e.py`) |

### Infrastruktur und Betrieb

- Docker und Docker Compose (`docker-compose.yaml`, `docker-compose.e2e.yaml`)
- MySQL 8, Gunicorn, nginx mit HTTP/2 und Weiterleitung auf HTTPS
- Let's Encrypt für die TLS-Zertifikate
- GitHub Actions mit `actions/checkout`, `actions/setup-node`, `actions/setup-python`,
  `actions/upload-artifact` und `appleboy/ssh-action` für das Deployment per SSH
- OVH-VPS, Domain und Mailserver bei IONOS

## Tests

Die Kernfunktionen werden mit Playwright so getestet, wie echte Nutzer die App bedienen: im
Browser, gegen das laufende Backend und Frontend.

- **110 Tests in 19 Testdateien:** Registrierung, Login, Passwort vergessen, 2FA, Haushalt
  anlegen, bearbeiten, beitreten, verlassen und auflösen, Kosten, Einkommen, Kategorien,
  Dashboard, JeremyAI, Payment, KI-Einwilligung, Profil, Einstellungen, Landingpage und
  geschützte Routen
- Bestätigungsmails werden über Mailpit abgefangen und ausgelesen, TOTP-Codes im Test berechnet
- Gemini, Fish Audio und Stripe werden im Test simuliert, es sind keine echten API-Keys nötig
- Der Befehl `seed_e2e` legt für jeden Bereich eigene Test-Personen und Haushalte an, damit sich
  die Tests nicht gegenseitig beeinflussen
- In der Pipeline laufen 17 Kerntests parallel (`e2e/playwright.ci.config.ts`), lokal alle Tests

Ausführen und Details: [e2e/README.md](e2e/README.md)

## CI/CD

| Workflow | Auslöser | Ablauf |
|---|---|---|
| [`deploy.yml`](.github/workflows/deploy.yml) | Push und Pull Request auf `main` | Frontend: `npm ci`, Lint, Typecheck, Build. Backend: Abhängigkeiten, `manage.py check --deploy` und Django-Testrunner gegen einen MySQL-8-Service-Container |
| | nur Push auf `main`, wenn die Checks grün sind | Deployment per SSH: `git pull`, Images bauen, Datenbank starten, Migrationen ausführen, Container neu starten |
| [`e2e.yml`](.github/workflows/e2e.yml) | Push auf `main` | Playwright-Kerntests mit Mailpit als Service-Container, Report als Artefakt |

## Setup

Die komplette Anwendung läuft in Docker. Kurzfassung:

```bash
git clone https://github.com/dominik-dudys/Finanzmoench Finanzmoench
cd Finanzmoench
cp .env.example .env          # Werte eintragen, siehe SETUP.md
docker compose up -d --build
```

Danach ist die App unter http://localhost/ erreichbar. Umgebungsvariablen, Superuser,
Feature-Flags, externe Dienste, lokale Entwicklung ohne Docker und häufige Probleme stehen in
der **[SETUP.md](SETUP.md)**.

## Projektstruktur

```
.github/workflows/      CI/CD (deploy.yml, e2e.yml)
backend/                Django-Projekt
├── config/             Settings, URLs, E2E-Settings
├── accounts/           Nutzer, Auth, DSGVO
├── households/         Haushalte, Kategorien, Beitrittsanfragen
├── finances/           Einkommen, Kosten, Dashboard-Berechnung
├── voice_ai/           JeremyAI
├── payment/            Stripe
├── feature_flags/      Feature-Flags
├── core/               Admin-Dashboard, Audit-Log
└── templates/          E-Mail- und Admin-Templates
frontend/               React-App (Vite + TypeScript)
└── src/
    ├── app/            Router, Layouts, Seiten, Diagramme
    ├── features/       Fachliche Module (auth, costs, household, jeremyai, payment, …)
    ├── shared/         API-Client, i18n, gemeinsame Komponenten
    └── ui-components/  UI-Bausteine (shadcn/ui)
e2e/                    Playwright-Tests
nginx/                  Dockerfile und Konfiguration (dev/prod)
docker-compose.yaml     db, web, nginx
docker-compose.e2e.yaml Mailpit für die Tests
SETUP.md                Setup-Anleitung
```

## Team

| Name | Schwerpunkte |
|---|---|
| Frederik Dilge | CI/CD und Server-Deployment, Server-Administration, Datenstruktur, Payment und Authentifizierung |
| Dominik Dudys | Frontend, Docker, Feature-Flags |
| Julian Eichhorn | Geschäftslogik im Backend, LLM-Anbindung (JeremyAI) |

