import { expect, test } from '@playwright/test';
import { fillOtp, waitForCsrfCookie } from '../../helpers/auth';
import { waitForCode } from '../../helpers/mailpit';
import { NO_SESSION } from '../../helpers/personas';

test.use({ storageState: NO_SESSION });

test.describe('Registrierung', () => {
  test('neuer Account bestätigt die E-Mail per Code und landet im Dashboard', async ({ page }) => {
    const email = `neu-${Date.now()}@e2e.test`;
    const since = Date.now();

    await page.goto('/register');
    await waitForCsrfCookie(page);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Passwort', { exact: true }).fill('Sehr-Sicher-123!');
    await page.getByLabel('Passwort wiederholen').fill('Sehr-Sicher-123!');
    await page.getByRole('button', { name: 'Account erstellen' }).click();

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
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Passwort', { exact: true }).fill('Sehr-Sicher-123!');
    await page.getByLabel('Passwort wiederholen').fill('Sehr-Sicher-123!');
    await page.getByRole('button', { name: 'Account erstellen' }).click();
    await expect(page).toHaveURL(/\/register\/verify$/);

    await fillOtp(page, '000000');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/register\/verify$/);
  });

  test('ungültige E-Mail wird im Formular abgefangen', async ({ page }) => {
    await page.goto('/register');
    await waitForCsrfCookie(page);
    await page.getByLabel('Email').fill('keine-mail');
    await page.getByLabel('Passwort', { exact: true }).fill('Sehr-Sicher-123!');
    await page.getByLabel('Passwort wiederholen').fill('Sehr-Sicher-123!');
    await page.getByRole('button', { name: 'Account erstellen' }).click();
    await expect(page.getByText('Bitte gib eine gültige E-Mail-Adresse ein')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('zu kurzes Passwort wird abgelehnt', async ({ page }) => {
    await page.goto('/register');
    await waitForCsrfCookie(page);
    await page.getByLabel('Email').fill('kurz@e2e.test');
    await page.getByLabel('Passwort', { exact: true }).fill('kurz');
    await page.getByLabel('Passwort wiederholen').fill('kurz');
    await page.getByRole('button', { name: 'Account erstellen' }).click();
    await expect(page.getByText('Mindestens 8 Zeichen', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('Passwörter müssen übereinstimmen', async ({ page }) => {
    await page.goto('/register');
    await waitForCsrfCookie(page);
    await page.getByLabel('Email').fill('anders@e2e.test');
    await page.getByLabel('Passwort', { exact: true }).fill('Sehr-Sicher-123!');
    await page.getByLabel('Passwort wiederholen').fill('Anders-Sicher-123!');
    await page.getByRole('button', { name: 'Account erstellen' }).click();
    await expect(page.getByText('Die Passwörter stimmen nicht überein')).toBeVisible();
  });
});
