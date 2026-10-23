import { defineConfig, type Project } from '@playwright/test';
import base from './playwright.config';

// Schnelle Auswahl der Kerntests für die CI-Pipeline.
// Lokal: npx playwright test -c playwright.ci.config.ts
// Alle 126 Tests laufen weiterhin mit: npx playwright test

// [Testdatei, Testname]. Eingetragen sind nur Tests, die ohne vorherige Tests aus derselben Datei funktionieren.
const SMOKE_TESTS: [string, string][] = [
  ['landing.spec.ts', 'zeigt Hero, Funktionen, Ablauf und Preise'],
  ['protected-routes.spec.ts', '/dashboard leitet ohne Login auf /login um'],
  ['protected-routes.spec.ts', 'geschützte API antwortet ohne Login mit 401 oder 403'],
  ['login.spec.ts', 'Login mit Passwort und E-Mail-Code'],
  ['login.spec.ts', 'falsches Passwort zeigt eine Fehlermeldung'],
  ['register.spec.ts', 'neuer Account bestätigt die E-Mail per Code und landet im Dashboard'],
  ['create.spec.ts', 'Haushalt anlegen'],
  ['costs.spec.ts', 'Pflichtfelder werden geprüft'],
  ['costs.spec.ts', 'monatlichen Kostenposten anlegen'],
  ['incomes.spec.ts', 'Einkommen anlegen'],
  ['categories.spec.ts', 'Ausgaben-Kategorie anlegen'],
  ['dashboard.spec.ts', 'Kennzahlen des Haushalts'],
  ['dashboard.spec.ts', 'Hauptnavigation'],
  ['jeremy.spec.ts', 'Premium hat 10 Fragen pro Tag'],
  ['jeremy.spec.ts', 'Free-Limit erreicht'],
  ['payment.spec.ts', 'Checkout leitet zu Stripe weiter'],
  ['payment.spec.ts', 'Abo ist aktiv'],
];

// Nur diese Personen werden im Setup angemeldet (nacheinander, ca. 4 s pro Login)
const SMOKE_PERSONAS = ['anna', 'ben', 'kosten', 'einkommen', 'kategorie', 'jule', 'frei', 'prem'];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const smokeGrep = new RegExp(SMOKE_TESTS.map(([file, title]) => `${escape(file)} .*${escape(title)}`).join('|'));
const setupGrep = new RegExp(`Login (${SMOKE_PERSONAS.join('|')})\\b`);

const project = (name: string): Project => {
  const found = base.projects?.find((p) => p.name === name);
  if (!found) throw new Error(`Projekt "${name}" fehlt in playwright.config.ts`);
  return found;
};

export default defineConfig({
  ...base,
  workers: process.env.CI ? 4 : 2,
  // Gesamter Testlauf darf höchstens 5 Minuten dauern
  globalTimeout: 5 * 60_000,
  reporter: process.env.CI ? [['list'], ['github'], ['html', { open: 'never' }]] : base.reporter,
  projects: [
    { ...project('setup'), grep: setupGrep },
    { ...project('chromium'), grep: smokeGrep },
  ],
});
