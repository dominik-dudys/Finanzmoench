import { expect, test } from '@playwright/test';
import { authFile } from '../../helpers/personas';

test.describe('Premium für Free-Nutzer', () => {
  test.use({ storageState: authFile('frei') });

  test('Upgrade-Dialog öffnen und schließen', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('banner').getByRole('button', { name: 'Premium holen' }).click();

    const dialog = page.getByRole('dialog', { name: 'Finanzmönch Premium' });
    await expect(dialog).toContainText('Fragen an JeremyAI pro Tag');
    await expect(dialog).toContainText('4,99 € / Monat');
    await expect(dialog.getByRole('button', { name: 'Weiter zu Stripe' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Später' }).click();
    await expect(dialog).toBeHidden();
  });

  test('Checkout leitet zu Stripe weiter', async ({ page }) => {
    await page.route('**/api/payment/checkout/', (route) =>
      route.fulfill({ json: { url: '/einstellungen?checkout=cancel#premium' } }),
    );
    await page.goto('/dashboard');
    await page.getByRole('banner').getByRole('button', { name: 'Premium holen' }).click();
    await page.getByRole('dialog', { name: 'Finanzmönch Premium' }).getByRole('button', { name: 'Weiter zu Stripe' }).click();

    await expect(page).toHaveURL(/\/einstellungen/);
    await expect(page.getByText('Bezahlung abgebrochen.')).toBeVisible();
    await expect(page).not.toHaveURL(/checkout=/);
  });

  test('Stripe nicht erreichbar', async ({ page }) => {
    await page.route('**/api/payment/checkout/', (route) =>
      route.fulfill({ status: 502, json: { code: 'payment_provider_error' } }),
    );
    await page.goto('/einstellungen');
    const card = page.locator('#premium');
    await expect(card.getByText('Mit Premium kannst du Jeremy bis zu 10 Fragen pro Tag stellen statt 2.')).toBeVisible();
    await expect(card.getByText('Aktiv', { exact: true })).toHaveCount(0);
    await card.getByRole('button', { name: 'Premium holen' }).click();
    await expect(card.getByText('Stripe ist gerade nicht erreichbar. Bitte versuch es später erneut.')).toBeVisible();
  });

  test('Benutzermenü zeigt Free', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Benutzermenü' }).click();
    const menu = page.getByRole('menu');
    await expect(menu).toContainText('frei@e2e.test');
    await expect(menu.getByText('Free', { exact: true })).toBeVisible();
  });

  test('Upgrade-Wunsch von der Startseite öffnet den Dialog nach dem Login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('upgrade_intent', String(Date.now())));
    await page.goto('/dashboard');
    const dialog = page.getByRole('dialog', { name: 'Finanzmönch Premium' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Später' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => sessionStorage.getItem('upgrade_intent'))).toBeNull();
  });
});

test.describe('Premium-Nutzer', () => {
  test.use({ storageState: authFile('prem') });

  test('Abo ist aktiv', async ({ page }) => {
    await page.goto('/einstellungen');
    const card = page.locator('#premium');
    await expect(card.getByText('Aktiv', { exact: true })).toBeVisible();
    await expect(card.getByText(/Verlängert sich automatisch am \d{1,2}\.\d{1,2}\.\d{4}\./)).toBeVisible();
    await expect(page.getByRole('banner').getByRole('button', { name: 'Premium holen' })).toHaveCount(0);
  });

  test('Abo verwalten öffnet das Kundenportal', async ({ page }) => {
    await page.route('**/api/payment/portal/', (route) =>
      route.fulfill({ json: { url: '/einstellungen#premium' } }),
    );
    await page.goto('/einstellungen');
    const portal = page.waitForRequest('**/api/payment/portal/');
    await page.locator('#premium').getByRole('button', { name: 'Abo verwalten' }).click();
    await portal;
    await expect(page).toHaveURL(/\/einstellungen#premium$/);
  });

  test('Benutzermenü zeigt Premium', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Benutzermenü' }).click();
    await expect(page.getByRole('menu').getByText('Premium', { exact: true })).toBeVisible();
  });
});
