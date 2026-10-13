import { expect, test } from '@playwright/test';
import { authFile } from '../../helpers/personas';

test.describe('Haushalt verlassen', () => {
  test.use({ storageState: authFile('lena') });

  test('Abbrechen im Bestätigungsdialog lässt alles wie es ist', async ({ page }) => {
    await page.goto('/household');
    await page.getByRole('button', { name: 'Haushalt verlassen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Haushalt verlassen?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('#household-name')).toHaveValue('WG Verlassen');
  });

  test('Lena verlässt den Haushalt', async ({ page }) => {
    await page.goto('/household');
    await expect(page.getByText('Mitglieder (2)')).toBeVisible();
    await page.getByRole('button', { name: 'Haushalt verlassen' }).click();
    await page.getByRole('dialog', { name: 'Haushalt verlassen?' }).getByRole('button', { name: 'Ja, verlassen' }).click();

    await expect(page.getByText('Kein Haushalt')).toBeVisible();

    await page.goto('/profil');
    await expect(page.getByText('Du bist noch in keinem Haushalt.')).toBeVisible();
  });
});

test.describe('Haushalt auflösen', () => {
  test.use({ storageState: authFile('dieter') });

  test('Dieter löst den Haushalt endgültig auf', async ({ page }) => {
    await page.goto('/household');
    await expect(page.locator('#household-name')).toHaveValue('WG Auflösen');
    await page.getByRole('button', { name: 'Haushalt auflösen' }).click();

    const dialog = page.getByRole('dialog', { name: 'Haushalt wirklich auflösen?' });
    await expect(dialog.getByText('alle Mitglieder')).toBeVisible();
    await dialog.getByRole('button', { name: 'Ja, endgültig auflösen' }).click();

    await expect(page.getByText('Kein Haushalt')).toBeVisible();

    await page.goto('/cost');
    await expect(page.getByText('Kosten gehören zu einem Haushalt.')).toBeVisible();
  });
});
