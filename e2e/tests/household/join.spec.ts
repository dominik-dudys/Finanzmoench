import { expect, test } from '@playwright/test';
import { authFile, HOUSEHOLD_IDS } from '../../helpers/personas';

test.use({ storageState: authFile('clara') });

test.describe('Haushalt beitreten', () => {
  test('leere ID wird abgefangen', async ({ page }) => {
    await page.goto('/household');
    await page.getByRole('button', { name: 'Haushalt beitreten' }).click();
    await page.getByRole('button', { name: 'Beitreten' }).click();
    await expect(page.getByText('Bitte Haushalts-ID eingeben')).toBeVisible();
  });

  test('ungültiges ID-Format wird abgelehnt', async ({ page }) => {
    await page.goto('/household');
    await page.getByRole('button', { name: 'Haushalt beitreten' }).click();
    await page.getByLabel('Haushalts-ID').fill('keine-uuid');
    await page.getByRole('button', { name: 'Beitreten' }).click();
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText('%(value)s');
    await expect(alert).not.toContainText('is not a valid UUID');
  });

  test('unbekannte ID wird abgelehnt', async ({ page }) => {
    await page.goto('/household');
    await page.getByRole('button', { name: 'Haushalt beitreten' }).click();
    await page.getByLabel('Haushalts-ID').fill('99999999-9999-9999-9999-999999999999');
    await page.getByRole('button', { name: 'Beitreten' }).click();
    await expect(page.getByText('Ein Haushalt mit dieser ID existiert nicht.')).toBeVisible();
  });

  test('Gastgeberin sieht die Haushalts-ID zum Einladen', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile('dora') });
    const page = await context.newPage();
    await page.goto('/household');
    await expect(page.getByText('Mitglieder einladen')).toBeVisible();
    await expect(page.locator('code').filter({ hasText: HOUSEHOLD_IDS.beitritt })).toBeVisible();
    await context.close();
  });

  test.fixme('Clara tritt bei und beide sehen sich als Mitglieder', async ({ page, browser }) => {
    await page.goto('/household');
    await page.getByRole('button', { name: 'Haushalt beitreten' }).click();
    await page.getByLabel('Haushalts-ID').fill(HOUSEHOLD_IDS.beitritt);
    await page.getByRole('button', { name: 'Beitreten' }).click();

    await expect(page.locator('#household-name')).toHaveValue('WG Beitritt');
    await expect(page.getByText('Mitglieder (2)')).toBeVisible();
    await expect(page.getByText('Dora Gastgeberin')).toBeVisible();

    const doraContext = await browser.newContext({ storageState: authFile('dora') });
    const dora = await doraContext.newPage();
    await dora.goto('/household');
    await expect(dora.getByText('Mitglieder (2)')).toBeVisible();
    await expect(dora.getByText('Clara Gast')).toBeVisible();
    await doraContext.close();
  });
});
