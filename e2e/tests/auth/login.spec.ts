import { expect, test } from '@playwright/test';
import { fillOtp, loginWithEmailCode, logout, submitPasswordLogin } from '../../helpers/auth';
import { waitForCode } from '../../helpers/mailpit';
import { NO_SESSION, personas } from '../../helpers/personas';

const user = personas.logout;

test.use({ storageState: NO_SESSION });

test.describe('Login und Logout', () => {
  test('Login mit Passwort und E-Mail-Code', async ({ page }) => {
    await loginWithEmailCode(page, user.email);
    await expect(page.getByRole('button', { name: 'Benutzermenü' })).toBeVisible();
  });

  test('falsches Passwort zeigt eine Fehlermeldung', async ({ page }) => {
    await submitPasswordLogin(page, user.email, 'falsches-passwort');
    await expect(page.getByText('E-Mail oder Passwort ist falsch')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Login-Formular prüft die Eingaben', async ({ page }) => {
    await page.goto('/login');
    await page.locator('form').getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByText('Bitte gib eine gültige E-Mail-Adresse ein')).toBeVisible();
    await expect(page.getByText('Bitte gib dein Passwort ein')).toBeVisible();
  });

  test('falscher Login-Code wird abgelehnt, der richtige danach akzeptiert', async ({ page }) => {
    const since = Date.now();
    await submitPasswordLogin(page, user.email);
    await expect(page).toHaveURL(/\/login\/code$/);

    await fillOtp(page, '000000');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login\/code$/);

    await fillOtp(page, await waitForCode(user.email, since));
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('Code erneut senden schickt einen neuen Code', async ({ page }) => {
    const since = Date.now();
    await submitPasswordLogin(page, user.email);
    await expect(page).toHaveURL(/\/login\/code$/);
    const firstCode = await waitForCode(user.email, since);

    const resendSince = Date.now();
    await page.getByRole('button', { name: 'Code erneut senden' }).click();
    await expect(page.getByText('Wir haben dir einen neuen Code geschickt.')).toBeVisible();

    const secondCode = await waitForCode(user.email, resendSince, { exclude: [firstCode] });
    await fillOtp(page, secondCode);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('Abmelden beendet die Session', async ({ page }) => {
    await loginWithEmailCode(page, user.email);
    await logout(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Link "Noch kein Account?" führt zur Registrierung', async ({ page }) => {
    await page.goto('/login');
    await page.locator('form').getByRole('link', { name: 'Registrieren' }).click();
    await expect(page).toHaveURL(/\/register$/);
  });
});
