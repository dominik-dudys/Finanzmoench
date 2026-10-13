import { expect, test, type Locator, type Page } from '@playwright/test';
import { fillOtp, loginWithEmailCode, logout, submitPasswordLogin } from '../../helpers/auth';
import { NO_SESSION, PASSWORD, personas } from '../../helpers/personas';
import { freshTotp } from '../../helpers/totp';

const user = personas.tom;

test.use({ storageState: NO_SESSION });

test.describe.serial('Zwei-Faktor-Authentifizierung', () => {
  let secret = '';
  let recoveryCodes: string[] = [];
  const usedCodes = new Set<string>();

  async function confirmPasswordIfAsked(page: Page, done: Locator) {
    const dialog = page.getByRole('dialog', { name: 'Passwort bestätigen' });
    await expect(dialog.or(done).first()).toBeVisible();
    if (await dialog.isVisible()) {
      await dialog.locator('input[type="password"]').fill(PASSWORD);
      await dialog.getByRole('button', { name: 'Bestätigen' }).click();
    }
  }

  test('2FA in den Einstellungen aktivieren', async ({ page }) => {
    await loginWithEmailCode(page, user.email);
    await page.goto('/einstellungen');

    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Zwei-Faktor-Authentifizierung' });
    await card.getByRole('button', { name: '2FA aktivieren' }).click();

    const secretText = await card.getByText(/Oder manuell eingeben:/).textContent();
    secret = (secretText ?? '').replace('Oder manuell eingeben:', '').trim();
    expect(secret).toMatch(/^[A-Z2-7]+=*$/);

    await card.locator('input[data-input-otp]').fill(await freshTotp(secret, usedCodes));
    await confirmPasswordIfAsked(page, card.getByText('Sie werden nur jetzt angezeigt.'));

    await expect(card.getByText('Sie werden nur jetzt angezeigt.')).toBeVisible();
    recoveryCodes = (await card.locator('.font-mono span').allTextContents()).map((c) => c.trim()).filter(Boolean);
    expect(recoveryCodes.length).toBeGreaterThan(0);

    await card.getByRole('button', { name: 'Ich habe sie gespeichert' }).click();
    await expect(card.getByText(/Aktiv seit/)).toBeVisible();
    await expect(card.getByText(/Wiederherstellungscodes übrig/)).toBeVisible();
  });

  test('Login verlangt jetzt den Authenticator-Code statt des E-Mail-Codes', async ({ page }) => {
    await submitPasswordLogin(page, user.email);
    await expect(page).toHaveURL(/\/login\/2fa$/);
    await expect(page.getByRole('heading', { name: 'Zwei-Faktor-Authentifizierung' })).toBeVisible();

    await fillOtp(page, await freshTotp(secret, usedCodes));
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('falscher Authenticator-Code wird abgelehnt', async ({ page }) => {
    await submitPasswordLogin(page, user.email);
    await expect(page).toHaveURL(/\/login\/2fa$/);
    await fillOtp(page, '000000');
    await expect(page.getByText('Der Code ist ungültig.')).toBeVisible();
  });

  test('Login mit Wiederherstellungscode', async ({ page }) => {
    await submitPasswordLogin(page, user.email);
    await expect(page).toHaveURL(/\/login\/2fa$/);

    await page.getByRole('button', { name: 'Wiederherstellungscode verwenden' }).click();
    await expect(page.getByText('Gib einen deiner Wiederherstellungscodes ein.')).toBeVisible();
    await page.locator('form input').first().fill(recoveryCodes[0]);
    await page.locator('form').getByRole('button', { name: 'Anmelden', exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('2FA wieder deaktivieren, danach gilt wieder der E-Mail-Code', async ({ page }) => {
    await submitPasswordLogin(page, user.email);
    await expect(page).toHaveURL(/\/login\/2fa$/);
    await fillOtp(page, await freshTotp(secret, usedCodes));
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/einstellungen');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Zwei-Faktor-Authentifizierung' });
    await card.getByRole('button', { name: 'Deaktivieren' }).click();
    await confirmPasswordIfAsked(page, card.getByRole('button', { name: '2FA aktivieren' }));
    await expect(card.getByRole('button', { name: '2FA aktivieren' })).toBeVisible();

    await logout(page);
    await loginWithEmailCode(page, user.email);
  });
});
