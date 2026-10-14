import { expect, test } from '@playwright/test';
import { authFile } from '../../helpers/personas';

test.use({ storageState: authFile('edith') });

test.describe('Haushalt bearbeiten', () => {
  test('Speichern ist erst nach einer Änderung aktiv', async ({ page }) => {
    await page.goto('/household');
    await expect(page.locator('#household-name')).toHaveValue('WG Bearbeiten');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Diese Angaben gelten für alle Mitglieder.' });
    await expect(card.getByRole('button', { name: 'Speichern' })).toBeDisabled();
    await page.locator('#household-name').fill('WG Bearbeiten Neu');
    await expect(card.getByRole('button', { name: 'Speichern' })).toBeEnabled();
  });

  test('Zurücksetzen verwirft Änderungen', async ({ page }) => {
    await page.goto('/household');
    await page.locator('#household-name').fill('Wird verworfen');
    await page.getByRole('button', { name: 'Zurücksetzen' }).click();
    await expect(page.locator('#household-name')).toHaveValue('WG Bearbeiten');
  });

  test('ungültige Eingaben werden angezeigt', async ({ page }) => {
    await page.goto('/household');
    await page.locator('#household-postal').fill('12');
    await page.locator('#household-address').fill('Ohne Nummer');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Diese Angaben gelten für alle Mitglieder.' });
    await card.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText('Genau 5 Ziffern')).toBeVisible();
    await expect(page.getByText('Format: Straße Hausnummer (z. B. Hauptstraße 42)')).toBeVisible();
  });

  test('Änderungen werden gespeichert und bleiben nach dem Neuladen', async ({ page }) => {
    await page.goto('/household');
    await page.locator('#household-name').fill('WG Bearbeitet');
    await page.locator('#household-address').fill('Neubauweg 9');
    await page.locator('#household-postal').fill('30161');
    await page.locator('#household-city').fill('Hannover');
    await page.locator('#household-currency').selectOption('USD');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Diese Angaben gelten für alle Mitglieder.' });
    await card.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByText('Haushalt gespeichert')).toBeVisible();

    await page.reload();
    await expect(page.locator('#household-name')).toHaveValue('WG Bearbeitet');
    await expect(page.locator('#household-address')).toHaveValue('Neubauweg 9');
    await expect(page.locator('#household-postal')).toHaveValue('30161');
    await expect(page.locator('#household-currency')).toHaveValue('USD');
  });
});
