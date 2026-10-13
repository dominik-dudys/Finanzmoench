import { expect, test } from '@playwright/test';
import { fillOtp, loginWithEmailCode } from '../../helpers/auth';
import { waitForCode } from '../../helpers/mailpit';
import { NO_SESSION, personas } from '../../helpers/personas';

const user = personas.vera;
const NEW_PASSWORD = 'Neu-Vergessen-456!';

test.use({ storageState: NO_SESSION });

test.describe.serial('Passwort vergessen', () => {
  test('Link im Login führt zur Passwort-vergessen-Seite', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Passwort vergessen?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole('heading', { name: 'Passwort vergessen?' })).toBeVisible();
  });

  test('ungültige E-Mail wird abgefangen', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill('keine-mail');
    await page.getByRole('button', { name: 'Code senden' }).click();
    await expect(page.getByText('Bitte gib eine gültige E-Mail-Adresse ein')).toBeVisible();
  });

  test('Passwort per Code zurücksetzen und mit neuem Passwort anmelden', async ({ page }) => {
    const since = Date.now();
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(user.email);
    await page.getByRole('button', { name: 'Code senden' }).click();

    await expect(page).toHaveURL(/\/forgot-password\/reset$/);
    await expect(page.getByRole('heading', { name: 'Neues Passwort festlegen' })).toBeVisible();

    await fillOtp(page, await waitForCode(user.email, since));
    await page.getByLabel('Neues Passwort', { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel('Passwort wiederholen').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Passwort ändern' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Dein Passwort wurde geändert. Du kannst dich jetzt anmelden.')).toBeVisible();

    await loginWithEmailCode(page, user.email, NEW_PASSWORD);
  });
});
