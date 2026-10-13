import { expect, test } from '@playwright/test';
import { authFile } from '../../helpers/personas';

test.describe('Profil', () => {
  test.use({ storageState: authFile('paula') });

  test('zeigt die persönlichen Daten', async ({ page }) => {
    await page.goto('/profil');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Persönliche Daten' });
    await expect(card.getByLabel('Vorname')).toHaveValue('Paula');
    await expect(card.getByLabel('Nachname')).toHaveValue('Profil');
    await expect(card.getByLabel('E-Mail')).toHaveValue('paula@e2e.test');
    await expect(card.getByLabel('E-Mail')).toBeDisabled();
    await expect(card.getByText('Anmeldeart: Passwort')).toBeVisible();
    await expect(card.getByText(/^Mitglied seit \d{1,2}\.\d{1,2}\.\d{4}$/)).toBeVisible();
    await expect(card.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });

  test('Vorname ist Pflicht', async ({ page }) => {
    await page.goto('/profil');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Persönliche Daten' });
    await card.getByLabel('Vorname').fill('');
    await card.getByRole('button', { name: 'Speichern' }).click();
    await expect(card.getByText('Bitte gib deinen Vornamen ein')).toBeVisible();
  });

  test('Name ändern und speichern', async ({ page }) => {
    await page.goto('/profil');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Persönliche Daten' });
    const save = card.getByRole('button', { name: 'Speichern' });

    await card.getByLabel('Nachname').fill('Profilneu');
    await expect(save).toBeEnabled();
    await save.click();
    await expect(save).toBeDisabled();

    await page.reload();
    await expect(card.getByLabel('Nachname')).toHaveValue('Profilneu');

    await card.getByLabel('Nachname').fill('Profil');
    await save.click();
    await expect(save).toBeDisabled();
  });

  test('ohne Haushalt', async ({ page }) => {
    await page.goto('/profil');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Haushalt' }).last();
    await expect(card.getByText('Du bist noch in keinem Haushalt.')).toBeVisible();
    await card.getByRole('link', { name: 'Haushalt erstellen oder beitreten' }).click();
    await expect(page).toHaveURL(/\/household$/);
  });
});

test.describe('Profil mit Haushalt', () => {
  test.use({ storageState: authFile('anna') });

  test('zeigt den Haushalt', async ({ page }) => {
    await page.goto('/profil');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Haushalt bearbeiten' });
    await expect(card).toContainText('WG Dashboard');
    await expect(card).toContainText('Teststraße 1');
    await expect(card).toContainText('2 Mitglieder');
    await card.getByRole('link', { name: 'Haushalt bearbeiten' }).click();
    await expect(page).toHaveURL(/\/household$/);
  });
});
