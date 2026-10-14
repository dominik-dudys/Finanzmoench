import { expect, test, type Locator, type Page } from '@playwright/test';
import { authFile, unique } from '../../helpers/personas';

test.use({ storageState: authFile('kosten') });

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function germanDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

async function openNewCostDialog(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Neuer Kostenposten' }).click();
  const dialog = page.getByRole('dialog', { name: 'Neuer Kostenposten' });
  await expect(dialog.getByLabel('Anteil Karla')).toHaveValue('100.00');
  return dialog;
}

async function fillCost(dialog: Locator, name: string, amount: string, category = 'Miete & Nebenkosten') {
  await dialog.getByLabel('Name', { exact: true }).fill(name);
  await dialog.getByLabel('Betrag', { exact: true }).fill(amount);
  await dialog.getByLabel('Kategorie', { exact: true }).selectOption({ label: category });
}

function row(page: Page, name: string) {
  return page.getByRole('listitem').filter({ hasText: name });
}

test.describe.serial('Kosten', () => {
  test('leerer Zustand', async ({ page }) => {
    await page.goto('/cost');
    await expect(page.getByRole('heading', { name: 'Kosten', exact: true })).toBeVisible();
    await expect(page.getByText('Noch keine Kosten')).toBeVisible();
    await expect(page.getByText(/≈ 0,00\s€ pro Monat/)).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Alle Kosten (0)' })).toBeVisible();
    await page.getByRole('tab', { name: /Verträge/ }).click();
    await expect(page.getByText('Noch keine Verträge')).toBeVisible();
  });

  test('Pflichtfelder werden geprüft', async ({ page }) => {
    await page.goto('/cost');
    const dialog = await openNewCostDialog(page);
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog.getByText('Bitte gib einen Namen ein')).toBeVisible();
    await expect(dialog.getByText('Bitte gib einen Betrag ein, z. B. 12,99')).toBeVisible();
    await expect(dialog.getByText('Bitte wähle eine Kategorie aus')).toBeVisible();

    await dialog.getByLabel('Betrag', { exact: true }).fill('12,999');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog.getByText('Bitte gib einen Betrag ein, z. B. 12,99')).toBeVisible();

    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(dialog).toBeHidden();
  });

  test('Enddatum vor Startdatum wird abgelehnt', async ({ page }) => {
    await page.goto('/cost');
    const dialog = await openNewCostDialog(page);
    await fillCost(dialog, unique('Fehler'), '10');
    await dialog.getByLabel('Startdatum (optional)').fill(isoDate(10));
    await dialog.getByLabel('Enddatum (optional)').fill(isoDate(0));
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog.getByText('Das Enddatum darf nicht vor dem Startdatum liegen.')).toBeVisible();
  });

  test('Aufteilung muss 100 % ergeben', async ({ page }) => {
    await page.goto('/cost');
    const dialog = await openNewCostDialog(page);
    await fillCost(dialog, unique('Fehler'), '10');
    await dialog.getByLabel('Anteil Karla').fill('60');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog.getByText('Die Aufteilung muss 100 % ergeben. Aktuell: 60.00 %')).toBeVisible();

    await dialog.getByRole('button', { name: 'Gleichmäßig' }).click();
    await expect(dialog.getByLabel('Anteil Karla')).toHaveValue('100.00');
  });

  test('monatlichen Kostenposten anlegen', async ({ page }) => {
    await page.goto('/cost');
    const dialog = await openNewCostDialog(page);
    await fillCost(dialog, 'Strom', '85,50');
    await dialog.getByLabel('Beschreibung (optional)').fill('Stadtwerke');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog).toBeHidden();

    const strom = row(page, 'Strom');
    await expect(strom).toContainText('Miete & Nebenkosten');
    await expect(strom).toContainText(/85,50\s€/);
    await expect(strom).toContainText('pro Monat');
    await expect(page.getByRole('tab', { name: 'Alle Kosten (1)' })).toBeVisible();
    await expect(page.getByText(/≈ 85,50\s€ pro Monat/)).toBeVisible();
  });

  test('Vertrag mit Laufzeit und jährlichem Intervall anlegen', async ({ page }) => {
    const start = isoDate(-30);
    await page.goto('/cost');
    const dialog = await openNewCostDialog(page);
    await fillCost(dialog, 'Haftpflicht', '120', 'Versicherungen');
    await dialog.getByLabel('Intervall').selectOption('yearly');
    await dialog.getByLabel('Startdatum (optional)').fill(start);
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog).toBeHidden();

    await expect(row(page, 'Haftpflicht')).toContainText('pro Jahr');
    await expect(page.getByText(/≈ 95,50\s€ pro Monat/)).toBeVisible();

    await page.getByRole('tab', { name: 'Verträge (1)' }).click();
    await expect(row(page, 'Haftpflicht')).toContainText(`seit ${germanDate(start)} · unbefristet`);
    await expect(row(page, 'Strom')).toHaveCount(0);
    await expect(page.getByText(/≈ 10,00\s€ pro Monat/)).toBeVisible();
  });

  test('Kostenposten bearbeiten', async ({ page }) => {
    await page.goto('/cost');
    await page.getByRole('button', { name: 'Aktionen für Strom' }).click();
    await page.getByRole('menuitem', { name: 'Bearbeiten' }).click();

    const dialog = page.getByRole('dialog', { name: 'Kostenposten bearbeiten' });
    await expect(dialog.getByLabel('Name', { exact: true })).toHaveValue('Strom');
    await expect(dialog.getByLabel('Anteil Karla')).toHaveValue('100.00');
    await dialog.getByLabel('Betrag', { exact: true }).fill('92');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog).toBeHidden();

    await expect(row(page, 'Strom')).toContainText(/92,00\s€/);
    await expect(page.getByRole('tab', { name: 'Alle Kosten (2)' })).toBeVisible();
    await page.reload();
    await expect(row(page, 'Strom')).toContainText(/92,00\s€/);
  });

  test('Kostenposten archivieren', async ({ page }) => {
    await page.goto('/cost');
    await page.getByRole('button', { name: 'Aktionen für Haftpflicht' }).click();
    await page.getByRole('menuitem', { name: 'Archivieren' }).click();

    const dialog = page.getByRole('dialog', { name: 'Kostenposten archivieren?' });
    await expect(dialog).toContainText('„Haftpflicht“ wird beendet');
    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(row(page, 'Haftpflicht')).toBeVisible();

    await page.getByRole('button', { name: 'Aktionen für Haftpflicht' }).click();
    await page.getByRole('menuitem', { name: 'Archivieren' }).click();
    await dialog.getByRole('button', { name: 'Archivieren' }).click();
    await expect(dialog).toBeHidden();

    await expect(row(page, 'Haftpflicht')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Alle Kosten (1)' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Verträge (0)' })).toBeVisible();
  });

  test('ohne Haushalt gibt es keine Kosten', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile('paula') });
    const page = await context.newPage();
    await page.goto('/cost');
    await expect(page.getByText('Kosten gehören zu einem Haushalt.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Neuer Kostenposten' })).toHaveCount(0);
    await context.close();
  });
});
