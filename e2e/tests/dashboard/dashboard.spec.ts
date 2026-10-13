import { expect, test, type Page } from '@playwright/test';
import { authFile } from '../../helpers/personas';

test.use({ storageState: authFile('anna') });

function kpi(page: Page, label: string) {
  return page.getByText(label, { exact: true }).first().locator('..');
}

function card(page: Page, title: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: title });
}

test.describe('Dashboard', () => {
  test('Kennzahlen des Haushalts', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

    const month = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(new Date());
    await expect(page.getByText(month, { exact: true })).toBeVisible();

    await expect(kpi(page, 'Fixkosten pro Monat')).toContainText(/940,00\s€/);
    await expect(kpi(page, 'Hochrechnung Jahr')).toContainText(/11\.280,00\s€/);
    await expect(kpi(page, 'Überschuss pro Monat')).toContainText(/3\.060,00\s€/);
    await expect(kpi(page, 'Überschuss pro Monat')).toContainText('Ausgabenquote 23,5 %');
    await expect(kpi(page, 'Nächste Zahlung')).toContainText('–');
    await expect(kpi(page, 'Nächste Zahlung')).toContainText('Kein Startdatum hinterlegt');
    await expect(page.getByText('Noch keine Daten')).toHaveCount(0);
  });

  test('Diagramme, Zahlungen und Aufteilung pro Person', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(card(page, 'Verlauf')).toBeVisible();

    const categories = card(page, 'Nach Kategorie');
    await expect(categories).toBeVisible();
    await expect(categories).toContainText('Miete & Nebenkosten');
    await expect(categories).toContainText('Freizeit & Abos');

    await expect(card(page, 'Nächste Zahlungen')).toContainText('Keine anstehenden Zahlungen.');

    const persons = card(page, 'Pro Person');
    const anna = persons.getByRole('listitem').filter({ hasText: 'Anna' });
    const max = persons.getByRole('listitem').filter({ hasText: 'Max' });
    await expect(anna).toContainText(/2\.500,00\s€/);
    await expect(anna).toContainText(/470,00\s€/);
    await expect(anna).toContainText(/2\.030,00\s€/);
    await expect(max).toContainText(/1\.500,00\s€/);
    await expect(max).toContainText(/1\.030,00\s€/);
  });

  test('Links zu den Kosten', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Kosten verwalten' }).click();
    await expect(page).toHaveURL(/\/cost$/);
    await expect(page.getByRole('listitem').filter({ hasText: 'Miete' })).toContainText(/900,00\s€/);

    await page.goto('/dashboard');
    await card(page, 'Nächste Zahlungen').getByRole('link', { name: 'Alle anzeigen' }).click();
    await expect(page).toHaveURL(/\/cost$/);
  });

  test('ohne Haushalt wird auf die Haushaltsseite verwiesen', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile('paula') });
    const page = await context.newPage();
    await page.goto('/dashboard');
    await expect(page.getByText('Das Dashboard zeigt die Finanzen deines Haushalts.')).toBeVisible();
    await page.getByRole('link', { name: 'Haushalt erstellen oder beitreten' }).click();
    await expect(page).toHaveURL(/\/household$/);
    await context.close();
  });
});

test.describe('Navigation', () => {
  const items = [
    { label: 'Haushalte', url: /\/household$/ },
    { label: 'Einkommen', url: /\/income$/ },
    { label: 'Kosten', url: /\/cost$/ },
    { label: 'Kategorien', url: /\/kategorien$/ },
    { label: 'JeremyAI', url: /\/jeremy$/ },
    { label: 'Dashboard', url: /\/dashboard$/ },
  ];

  test('Hauptnavigation', async ({ page }) => {
    await page.goto('/dashboard');
    const nav = page.getByRole('banner');
    for (const item of items) {
      await nav.getByRole('link', { name: item.label, exact: true }).click();
      await expect(page).toHaveURL(item.url);
    }
    await nav.getByRole('link', { name: 'finanzmönch' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('Benutzermenü', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Benutzermenü' }).click();
    await expect(page.getByRole('menu')).toContainText('anna@e2e.test');
    await page.getByRole('menuitem', { name: 'Profil' }).click();
    await expect(page).toHaveURL(/\/profil$/);

    await page.getByRole('button', { name: 'Benutzermenü' }).click();
    await page.getByRole('menuitem', { name: 'Einstellungen' }).click();
    await expect(page).toHaveURL(/\/einstellungen$/);
  });
});
