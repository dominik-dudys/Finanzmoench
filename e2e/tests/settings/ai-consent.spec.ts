import { expect, test, type Page } from '@playwright/test';
import { authFile } from '../../helpers/personas';

test.use({ storageState: authFile('karl') });

function jeremyCard(page: Page) {
  return page.locator('[data-slot="card"]').filter({ hasText: 'Ich willige in die Datenverarbeitung durch JeremyAI ein' });
}

function switches(page: Page) {
  const card = jeremyCard(page);
  return { consent: card.getByRole('switch').nth(0), satire: card.getByRole('switch').nth(1) };
}

test.describe.serial('Einstellungen: JeremyAI und Konten', () => {
  test('verknüpfte Konten', async ({ page }) => {
    await page.goto('/einstellungen');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Verknüpfte Konten' });
    await expect(card.getByText('Google', { exact: true })).toBeVisible();
    await expect(card.getByText('GitHub', { exact: true })).toBeVisible();
    await expect(card.getByText('Nicht verbunden')).toHaveCount(2);
    await expect(card.getByRole('button', { name: 'Verbinden' })).toHaveCount(2);
  });

  test('Satire-Modus umschalten', async ({ page }) => {
    await page.goto('/einstellungen');
    const { consent, satire } = switches(page);
    await expect(consent).toBeChecked();
    await expect(jeremyCard(page).getByText(/Eingewilligt am/)).toBeVisible();
    await expect(satire).not.toHaveAttribute('data-disabled');
    await expect(satire).not.toBeChecked();

    await satire.click();
    await expect(satire).toBeChecked();
    await page.reload();
    await expect(switches(page).satire).toBeChecked();
  });

  test('Einwilligung widerrufen und erneut erteilen', async ({ page }) => {
    await page.goto('/einstellungen');
    const { consent, satire } = switches(page);

    await consent.click();
    await expect(consent).not.toBeChecked();
    await expect(jeremyCard(page).getByText(/Eingewilligt am/)).toHaveCount(0);
    await expect(satire).toHaveAttribute('data-disabled');
    await expect(satire).not.toBeChecked();

    await page.goto('/jeremy');
    await expect(page.getByText('Jeremy braucht deine Einwilligung', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Jeremy aktivieren' })).toBeVisible();
    await expect(page.getByLabel('Frage an Jeremy')).toBeDisabled();
    await expect(page.getByLabel('Frage an Jeremy')).toHaveAttribute('placeholder', 'Erst Jeremy aktivieren');

    await page.goto('/einstellungen');
    await consent.click();
    await expect(consent).toBeChecked();
    await expect(jeremyCard(page).getByText(/Eingewilligt am/)).toBeVisible();
    await expect(satire).not.toHaveAttribute('data-disabled');
  });
});
