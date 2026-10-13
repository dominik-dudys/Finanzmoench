import { expect, test } from '@playwright/test';
import { loginWithEmailCode, logout, submitPasswordLogin } from '../../helpers/auth';
import { NO_SESSION, PASSWORD, personas } from '../../helpers/personas';

const user = personas.peter;
const NEW_PASSWORD = 'Neu-Passwort-789!';

test.use({ storageState: NO_SESSION });

test.describe.serial('Passwort ändern', () => {
  test('Formular prüft die Eingaben', async ({ page }) => {
    await loginWithEmailCode(page, user.email);
    await page.goto('/einstellungen');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Passwort ändern' });

    await card.getByRole('button', { name: 'Speichern' }).click();
    await expect(card.getByText('Bitte gib dein aktuelles Passwort ein')).toBeVisible();

    await card.getByLabel('Aktuelles Passwort').fill(PASSWORD);
    await card.getByLabel('Neues Passwort', { exact: true }).fill('kurz');
    await card.getByLabel('Neues Passwort wiederholen').fill('anders');
    await card.getByRole('button', { name: 'Speichern' }).click();
    await expect(card.getByText('Mindestens 8 Zeichen')).toBeVisible();
  });

  test('falsches aktuelles Passwort wird abgelehnt', async ({ page }) => {
    await loginWithEmailCode(page, user.email);
    await page.goto('/einstellungen');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Passwort ändern' });

    await card.getByLabel('Aktuelles Passwort').fill('falsches-passwort');
    await card.getByLabel('Neues Passwort', { exact: true }).fill(NEW_PASSWORD);
    await card.getByLabel('Neues Passwort wiederholen').fill(NEW_PASSWORD);
    await card.getByRole('button', { name: 'Speichern' }).click();

    await expect(card.getByRole('alert')).toBeVisible();
    await expect(card.getByText('Passwort wurde geändert.')).toBeHidden();
  });

  test('Passwort ändern und mit dem neuen Passwort anmelden', async ({ page }) => {
    await loginWithEmailCode(page, user.email);
    await page.goto('/einstellungen');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Passwort ändern' });

    await card.getByLabel('Aktuelles Passwort').fill(PASSWORD);
    await card.getByLabel('Neues Passwort', { exact: true }).fill(NEW_PASSWORD);
    await card.getByLabel('Neues Passwort wiederholen').fill(NEW_PASSWORD);
    await card.getByRole('button', { name: 'Speichern' }).click();
    await expect(card.getByText('Passwort wurde geändert.')).toBeVisible();

    await page.context().clearCookies();
    await submitPasswordLogin(page, user.email, PASSWORD);
    await expect(page.getByText('E-Mail oder Passwort ist falsch')).toBeVisible();

    await loginWithEmailCode(page, user.email, NEW_PASSWORD);
    await logout(page);
  });
});
