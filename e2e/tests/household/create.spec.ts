import { expect, test } from '@playwright/test';
import { authFile } from '../../helpers/personas';

test.use({ storageState: authFile('ben') });

test.describe.serial('Haushalt erstellen', () => {
  test('ohne Haushalt werden Erstellen und Beitreten angeboten', async ({ page }) => {
    await page.goto('/household');
    await expect(page.getByText('Kein Haushalt')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Haushalt erstellen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Haushalt beitreten' })).toBeVisible();
  });

  test('Formular prüft alle Felder', async ({ page }) => {
    await page.goto('/household');
    await page.getByRole('button', { name: 'Haushalt erstellen' }).click();

    await page.getByLabel('Adresse').fill('Hauptstraße');
    await page.getByLabel('PLZ').fill('123');
    await page.getByLabel('Stadt').fill('B');
    await page.getByRole('button', { name: 'Erstellen' }).click();

    await expect(page.getByText('Bitte gib einen Namen ein')).toBeVisible();
    await expect(page.getByText('Format: Straße Hausnummer (z. B. Hauptstraße 42)')).toBeVisible();
    await expect(page.getByText('Genau 5 Ziffern')).toBeVisible();
    await expect(page.getByText('Zu kurz')).toBeVisible();
  });

  test('Zurück verlässt das Formular ohne zu speichern', async ({ page }) => {
    await page.goto('/household');
    await page.getByRole('button', { name: 'Haushalt erstellen' }).click();
    await page.getByRole('button', { name: 'Zurück' }).click();
    await expect(page.getByText('Kein Haushalt')).toBeVisible();
  });

  test('Haushalt anlegen', async ({ page }) => {
    await page.goto('/household');
    await page.getByRole('button', { name: 'Haushalt erstellen' }).click();

    await page.getByLabel('Name').fill('Bens Wohnung');
    await page.getByLabel('Adresse').fill('Hauptstraße 42');
    await page.getByLabel('PLZ').fill('10115');
    await page.getByLabel('Stadt').fill('berlin');
    await page.getByLabel('Währung').selectOption('EUR');
    await page.getByRole('button', { name: 'Erstellen' }).click();

    await expect(page.locator('#household-name')).toHaveValue('Bens Wohnung');
    await expect(page.locator('#household-city')).toHaveValue('Berlin');
    await expect(page.getByText('Mitglieder (1)')).toBeVisible();
    await expect(page.getByText('Ben Neu')).toBeVisible();
    await expect(page.getByText('du', { exact: true })).toBeVisible();
  });

  test('neuer Haushalt hat die Standard-Kategorien', async ({ page }) => {
    await page.goto('/kategorien');
    for (const name of ['Miete & Nebenkosten', 'Lebensmittel', 'Mobilität (Auto/ÖPNV)', 'Versicherungen', 'Freizeit & Abos']) {
      await expect(page.getByRole('listitem').filter({ hasText: name })).toBeVisible();
    }
    await page.getByRole('tab', { name: /Einkommen/ }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Gehalt' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Kindergeld' })).toBeVisible();
  });
});
