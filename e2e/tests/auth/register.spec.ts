import { expect, test, type Page } from '@playwright/test';
import { fillOtp, waitForCsrfCookie } from '../../helpers/auth';
import { waitForCode } from '../../helpers/mailpit';
import { NO_SESSION } from '../../helpers/personas';

test.use({ storageState: NO_SESSION });

// Vor- und Nachname sind seit der Registrierungs-Erweiterung Pflichtfelder
async function fillSignup(page: Page, email: string, password: string, confirmPassword = password) {
  await page.getByLabel('Vorname').fill('Rita');
  await page.getByLabel('Nachname').fill('Registriert');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByLabel('Passwort wiederholen').fill(confirmPassword);
  await page.getByRole('button', { name: 'Account erstellen' }).click();
}

test.describe('Registrierung', () => {
  test('neuer Account bestätigt die E-Mail per Code und landet im Dashboard', async ({ page }) => {
    const email = `neu-${Date.now()}@e2e.test`;
    const since = Date.now();

    await page.goto('/register');
    await waitForCsrfCookie(page);
    await fillSignup(page, email, 'Sehr-Sicher-123!');

    await expect(page).toHaveURL(/\/register\/verify$/);
    await expect(page.getByRole('heading', { name: 'Bestätige deine E-Mail' })).toBeVisible();

    await fillOtp(page, await waitForCode(email, since));

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Das Dashboard zeigt die Finanzen deines Haushalts.')).toBeVisible();
  });

  test('falscher Bestätigungscode zeigt einen Fehler', async ({ page }) => {
    const email = `falsch-${Date.now()}@e2e.test`;

    await page.goto('/register');
    await waitForCsrfCookie(page);
    await fillSignup(page, email, 'Sehr-Sicher-123!');
    await expect(page).toHaveURL(/\/register\/verify$/);

    await fillOtp(page, '000000');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/register\/verify$/);
  });

  test('Vor- und Nachname sind Pflicht', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Account erstellen' }).click();
    await expect(page.getByText('Bitte gib deinen Vornamen ein')).toBeVisible();
    await expect(page.getByText('Bitte gib deinen Nachnamen ein')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('ungültige E-Mail wird im Formular abgefangen', async ({ page }) => {
    await page.goto('/register');
    await waitForCsrfCookie(page);
    await fillSignup(page, 'keine-mail', 'Sehr-Sicher-123!');
    await expect(page.getByText('Bitte gib eine gültige E-Mail-Adresse ein')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('zu kurzes Passwort wird abgelehnt', async ({ page }) => {
    await page.goto('/register');
    await waitForCsrfCookie(page);
    await fillSignup(page, 'kurz@e2e.test', 'kurz');
    await expect(page.getByText('Mindestens 8 Zeichen', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('Passwörter müssen übereinstimmen', async ({ page }) => {
    await page.goto('/register');
    await waitForCsrfCookie(page);
    await fillSignup(page, 'anders@e2e.test', 'Sehr-Sicher-123!', 'Anders-Sicher-123!');
    await expect(page.getByText('Die Passwörter stimmen nicht überein')).toBeVisible();
  });
});
