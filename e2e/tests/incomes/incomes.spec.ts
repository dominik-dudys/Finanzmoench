import { expect, test, type Page } from '@playwright/test';
import { authFile } from '../../helpers/personas';

test.use({ storageState: authFile('einkommen') });

function myRow(page: Page) {
  return page.getByRole('listitem').filter({ hasText: /Du · seit/ });
}

function ilseRow(page: Page) {
  return page.getByRole('listitem').filter({ hasText: /Ilse · seit/ });
}

test.describe.serial('Einnahmen', () => {
  test('Haushalt und eigene Einnahmen', async ({ page }) => {
    await page.goto('/income');
    await expect(page.getByRole('heading', { name: 'Einnahmen' })).toBeVisible();
    await expect(page.getByText(/^1\.800,00\s€ pro Monat$/)).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Haushalt (1)' })).toBeVisible();

    await expect(ilseRow(page)).toContainText('Gehalt');
    await expect(ilseRow(page)).toContainText(/1\.800,00\s€/);
    await expect(ilseRow(page).getByRole('button')).toHaveCount(0);

    await page.getByRole('tab', { name: 'Meine (0)' }).click();
    await expect(page.getByText('Du hast noch kein Einkommen hinterlegt')).toBeVisible();
  });

  test('Pflichtfelder werden geprüft', async ({ page }) => {
    await page.goto('/income');
    await page.getByRole('button', { name: 'Neues Einkommen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Neues Einkommen' });
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog.getByText('Bitte gib einen Betrag ein, z. B. 2500,00')).toBeVisible();
    await expect(dialog.getByText('Bitte wähle eine Kategorie aus')).toBeVisible();
    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(dialog).toBeHidden();
  });

  test('Einkommen anlegen', async ({ page }) => {
    await page.goto('/income');
    await page.getByRole('button', { name: 'Neues Einkommen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Neues Einkommen' });
    await dialog.getByLabel('Betrag pro Monat (netto)').fill('2100,50');
    await dialog.getByLabel('Kategorie').selectOption({ label: 'Gehalt' });
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog).toBeHidden();

    await expect(myRow(page)).toContainText('Gehalt');
    await expect(myRow(page)).toContainText(/2\.100,50\s€/);
    await expect(page.getByText(/^3\.900,50\s€ pro Monat$/)).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Haushalt (2)' })).toBeVisible();

    await page.getByRole('tab', { name: 'Meine (1)' }).click();
    await expect(ilseRow(page)).toHaveCount(0);
    await expect(page.getByText(/^2\.100,50\s€ pro Monat$/)).toBeVisible();
  });

  test('Einkommen bearbeiten', async ({ page }) => {
    await page.goto('/income');
    await myRow(page).getByRole('button', { name: 'Aktionen für Gehalt' }).click();
    await page.getByRole('menuitem', { name: 'Bearbeiten' }).click();

    const dialog = page.getByRole('dialog', { name: 'Einkommen bearbeiten' });
    await expect(dialog.getByText('Änderungen gelten ab heute.', { exact: false })).toBeVisible();
    await expect(dialog.getByLabel('Betrag pro Monat (netto)')).toHaveValue('2100.50');
    await dialog.getByLabel('Betrag pro Monat (netto)').fill('2300');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog).toBeHidden();

    await expect(myRow(page)).toContainText(/2\.300,00\s€/);
    await expect(page.getByText(/^4\.100,00\s€ pro Monat$/)).toBeVisible();
  });

  test('Einkommen archivieren', async ({ page }) => {
    await page.goto('/income');
    await myRow(page).getByRole('button', { name: 'Aktionen für Gehalt' }).click();
    await page.getByRole('menuitem', { name: 'Archivieren' }).click();

    const dialog = page.getByRole('dialog', { name: 'Einkommen archivieren?' });
    await expect(dialog).toContainText(/„Gehalt“ über 2\.300,00\s€ endet heute/);
    await dialog.getByRole('button', { name: 'Archivieren' }).click();
    await expect(dialog).toBeHidden();

    await expect(myRow(page)).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Haushalt (1)' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Meine (0)' })).toBeVisible();
  });

  test('Archiv zeigt beendete Einnahmen', async ({ page }) => {
    await page.goto('/income');
    await page.getByRole('button', { name: 'Archiv ansehen' }).click();

    await expect(page.getByRole('button', { name: 'Letzter Monat' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Neues Einkommen' })).toHaveCount(0);
    await expect(page.getByText('1 Eintrag im letzten Monat beendet')).toBeVisible();

    const kindergeld = page.getByRole('listitem').filter({ hasText: 'Kindergeld' });
    await expect(kindergeld).toContainText(/Du · zuletzt aktiv \d{2}\.\d{2}\.\d{4}/);
    await expect(kindergeld).toContainText(/250,00\s€/);
    await expect(kindergeld.getByRole('button')).toHaveCount(0);

    await page.getByRole('button', { name: 'Letzte 3 Monate' }).click();
    await expect(page.getByText('1 Eintrag in den letzten 3 Monaten beendet')).toBeVisible();

    await page.getByRole('button', { name: 'Zurück' }).click();
    await expect(page.getByRole('button', { name: 'Archiv ansehen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Neues Einkommen' })).toBeVisible();
  });

  test('ohne Haushalt gibt es keine Einnahmen', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile('paula') });
    const page = await context.newPage();
    await page.goto('/income');
    await expect(page.getByText('Einnahmen gehören zu einem Haushalt.')).toBeVisible();
    await context.close();
  });
});
