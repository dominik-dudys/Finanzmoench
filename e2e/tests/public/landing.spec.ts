import { expect, test } from '@playwright/test';

test.describe('Startseite', () => {
  test('zeigt Hero, Funktionen, Ablauf und Preise', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Deine Fixkosten endlich im griff.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alles, was du brauchst.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'In drei Schritten startklar' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preise' })).toBeVisible();
    await expect(page.getByText('4,99 € / Monat')).toBeVisible();
  });

  test('Anmelden im Header führt zum Login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('banner').getByRole('link', { name: 'Anmelden' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Willkommen zurück' })).toBeVisible();
  });

  test('Registrieren im Header führt zur Registrierung', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('banner').getByRole('link', { name: 'Registrieren' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: 'Erstelle dein Konto' })).toBeVisible();
  });

  test('Kostenlos starten im Preisbereich führt zur Registrierung', async ({ page }) => {
    await page.goto('/#preise');
    await page.locator('#preise').getByRole('link', { name: 'Kostenlos starten' }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('Registrieren & upgraden merkt sich den Upgrade-Wunsch', async ({ page }) => {
    await page.goto('/#preise');
    await page.locator('#preise').getByRole('link', { name: 'Registrieren & upgraden' }).click();
    await expect(page).toHaveURL(/\/register$/);
    const intent = await page.evaluate(() => sessionStorage.getItem('upgrade_intent'));
    expect(intent).not.toBeNull();
  });
});

test.describe('Rechtliches', () => {
  test('Impressum ist über den Footer erreichbar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: /Impressum/ }).click();
    await expect(page).toHaveURL(/\/impressum$/);
    await expect(page.getByText('Angaben gemäß § 5 DDG')).toBeVisible();
  });

  test('Datenschutzerklärung ist über den Footer erreichbar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: /Datenschutz/ }).click();
    await expect(page).toHaveURL(/\/datenschutz$/);
    await expect(page.getByRole('heading', { name: '1. Verantwortlicher' })).toBeVisible();
  });
});
