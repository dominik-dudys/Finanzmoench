import { expect, test, type Page } from '@playwright/test';
import { authFile, unique } from '../../helpers/personas';

test.use({ storageState: authFile('kategorie') });

async function createCategory(page: Page, name: string, type: 'Ausgabe' | 'Einkommen' = 'Ausgabe') {
  await page.getByRole('button', { name: 'Neue Kategorie' }).click();
  const dialog = page.getByRole('dialog', { name: 'Neue Kategorie' });
  await dialog.getByRole('button', { name: type, exact: true }).click();
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByRole('button', { name: /^Farbe #/ }).first().click();
  await dialog.getByRole('button', { name: 'Speichern' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('Kategorien', () => {
  test('Standard-Kategorien sind gesperrt', async ({ page }) => {
    await page.goto('/kategorien');
    const row = page.getByRole('listitem').filter({ hasText: 'Lebensmittel' });
    await expect(row.getByText('Standard')).toBeVisible();
    await expect(row.getByRole('button', { name: /Aktionen für/ })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Ausgaben (5)' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Einkommen (2)' })).toBeVisible();
  });

  test('Ausgaben-Kategorie anlegen', async ({ page }) => {
    const name = unique('Haustier');
    await page.goto('/kategorien');
    await createCategory(page, name);
    await expect(page.getByRole('listitem').filter({ hasText: name })).toBeVisible();
  });

  test('Einkommens-Kategorie anlegen', async ({ page }) => {
    const name = unique('Nebenjob');
    await page.goto('/kategorien');
    await createCategory(page, name, 'Einkommen');
    await page.getByRole('tab', { name: /Einkommen/ }).click();
    await expect(page.getByRole('listitem').filter({ hasText: name })).toBeVisible();
    await page.getByRole('tab', { name: /Ausgaben/ }).click();
    await expect(page.getByRole('listitem').filter({ hasText: name })).toHaveCount(0);
  });

  test('Name ist Pflicht', async ({ page }) => {
    await page.goto('/kategorien');
    await page.getByRole('button', { name: 'Neue Kategorie' }).click();
    const dialog = page.getByRole('dialog', { name: 'Neue Kategorie' });
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('doppelter Name wird abgelehnt', async ({ page }) => {
    await page.goto('/kategorien');
    await page.getByRole('button', { name: 'Neue Kategorie' }).click();
    const dialog = page.getByRole('dialog', { name: 'Neue Kategorie' });
    await dialog.getByLabel('Name').fill('Lebensmittel');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog.getByText('Eine Kategorie mit diesem Namen gibt es bereits.')).toBeVisible();
  });

  test('Kategorie umbenennen', async ({ page }) => {
    const name = unique('Sport');
    const renamed = `${name} Verein`;
    await page.goto('/kategorien');
    await createCategory(page, name);

    await page.getByRole('button', { name: `Aktionen für ${name}` }).click();
    await page.getByRole('menuitem', { name: 'Bearbeiten' }).click();
    const dialog = page.getByRole('dialog', { name: 'Kategorie bearbeiten' });
    await dialog.getByLabel('Name').fill(renamed);
    await dialog.getByRole('button', { name: 'Keine Farbe' }).click();
    await dialog.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByRole('listitem').filter({ hasText: renamed })).toBeVisible();
  });

  test('unbenutzte Kategorie löschen', async ({ page }) => {
    const name = unique('Wegwerf');
    await page.goto('/kategorien');
    await createCategory(page, name);

    await page.getByRole('button', { name: `Aktionen für ${name}` }).click();
    await page.getByRole('menuitem', { name: 'Löschen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Kategorie löschen?' });
    await dialog.getByRole('button', { name: 'Löschen' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole('listitem').filter({ hasText: name })).toHaveCount(0);
  });

  test('benutzte Kategorie löschen verschiebt die Kosten in die Ersatzkategorie', async ({ page }) => {
    const category = unique('Garten');
    const costName = unique('Rasenmäher');
    await page.goto('/kategorien');
    await createCategory(page, category);

    await page.goto('/cost');
    await page.getByRole('button', { name: 'Neuer Kostenposten' }).click();
    const costDialog = page.getByRole('dialog', { name: 'Neuer Kostenposten' });
    await expect(costDialog.getByLabel('Anteil Kai')).toBeVisible();
    await costDialog.getByLabel('Name').fill(costName);
    await costDialog.getByLabel('Betrag').fill('15');
    await costDialog.getByLabel('Kategorie').selectOption({ label: category });
    await costDialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: costName })).toContainText(category);

    await page.goto('/kategorien');
    await page.getByRole('button', { name: `Aktionen für ${category}` }).click();
    await page.getByRole('menuitem', { name: 'Löschen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Kategorie löschen?' });
    await dialog.getByLabel('Verträge dieser Kategorie verschieben nach').selectOption({ label: 'Lebensmittel (Standard)' });
    await dialog.getByRole('button', { name: 'Löschen' }).click();
    await expect(dialog).toBeHidden();

    await page.goto('/cost');
    await expect(page.getByRole('listitem').filter({ hasText: costName })).toContainText('Lebensmittel');
  });

  test('ohne Haushalt wird auf die Haushaltsseite verwiesen', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile('paula') });
    const page = await context.newPage();
    await page.goto('/kategorien');
    await expect(page.getByText('Kategorien gehören zu einem Haushalt.')).toBeVisible();
    await page.getByRole('link', { name: 'Haushalt erstellen oder beitreten' }).click();
    await expect(page).toHaveURL(/\/household$/);
    await context.close();
  });
});
