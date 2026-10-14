import { expect, test, type Page } from '@playwright/test';
import { authFile } from '../../helpers/personas';

const ANSWER = 'Lege jeden Monat zuerst 10 % deines Einkommens zur Seite.';

async function mockJeremyAnswer(page: Page, text = ANSWER) {
  await page.route('**/api/voice-ai/jeremy/', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'audio/mpeg',
      headers: { 'x-jeremy-text': encodeURIComponent(text) },
      body: Buffer.from([0xff, 0xfb, 0x90, 0x00]),
    }),
  );
}

test.describe.serial('Jeremy: Einwilligung und Chat', () => {
  test.use({ storageState: authFile('jonas') });

  test('Jeremy aktivieren', async ({ page }) => {
    await page.goto('/jeremy');
    await expect(page.getByRole('heading', { name: 'JeremyAI' })).toBeVisible();
    await expect(page.getByText('Jeremy braucht deine Einwilligung', { exact: false })).toBeVisible();
    await expect(page.getByLabel('Frage an Jeremy')).toBeDisabled();

    await page.getByRole('button', { name: 'Jeremy aktivieren' }).click();
    const dialog = page.getByRole('dialog', { name: 'JeremyAI aktivieren' });
    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Jeremy aktivieren' }).click();
    await dialog.getByRole('button', { name: 'Einwilligen & starten' }).click();
    await expect(page.getByText('Jeremy ist aktiviert – stell deine erste Frage!')).toBeVisible();
    await expect(dialog).toBeHidden();

    await expect(page.getByText('Noch 2 von 2 Fragen heute')).toBeVisible();
    await expect(page.getByText('Stell Jeremy eine Frage zu deinen Finanzen!')).toBeVisible();
    await expect(page.getByLabel('Frage an Jeremy')).toBeEnabled();
    await expect(page.getByText('Allgemeine Tipps – keine Finanzberatung.')).toBeVisible();
  });

  test('Frage stellen und Antwort erhalten', async ({ page }) => {
    await mockJeremyAnswer(page);
    await page.goto('/jeremy');

    const input = page.getByLabel('Frage an Jeremy');
    const send = page.getByRole('button', { name: 'Senden' });
    await expect(send).toBeDisabled();

    await input.fill('Wie spare ich am besten?');
    await send.click();

    await expect(page.getByText('Wie spare ich am besten?')).toBeVisible();
    await expect(page.getByText(ANSWER)).toBeVisible();
    await expect(page.locator('audio')).toHaveCount(1);
    await expect(input).toHaveValue('');
    await expect(page.getByText('Stell Jeremy eine Frage zu deinen Finanzen!')).toHaveCount(0);
  });

  test('Fehler werden im Chat angezeigt', async ({ page }) => {
    await page.route('**/api/voice-ai/jeremy/', (route) =>
      route.fulfill({ status: 503, json: { code: 'jeremy_disabled' } }),
    );
    await page.goto('/jeremy');
    await page.getByLabel('Frage an Jeremy').fill('Hallo?');
    await page.getByLabel('Frage an Jeremy').press('Enter');
    await expect(page.getByText('Jeremy ist gerade nicht verfügbar.', { exact: true })).toBeVisible();

    await page.unroute('**/api/voice-ai/jeremy/');
    await page.route('**/api/voice-ai/jeremy/', (route) =>
      route.fulfill({ status: 429, json: { code: 'ai_busy' } }),
    );
    await page.getByLabel('Frage an Jeremy').fill('Und jetzt?');
    await page.getByRole('button', { name: 'Senden' }).click();
    await expect(page.getByText('Jeremy ist gerade überlastet. Versuch es in ein paar Sekunden nochmal.')).toBeVisible();
  });

  test('Satire-Modus auf der Jeremy-Seite', async ({ page }) => {
    await page.goto('/jeremy');
    const toggle = page.getByRole('switch');
    await expect(toggle).not.toBeChecked();

    await toggle.click();
    await expect(toggle).toBeChecked();
    await expect(page.getByText('Satire-Modus: nicht ernst gemeint – keine Finanzberatung.')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('switch')).toBeChecked();
    await page.getByRole('switch').click();
    await expect(page.getByText('Allgemeine Tipps – keine Finanzberatung.')).toBeVisible();
  });
});

test.describe('Jeremy: Tageslimit', () => {
  test.use({ storageState: authFile('jule') });

  test('Free-Limit erreicht', async ({ page }) => {
    await page.goto('/jeremy');
    await expect(page.getByText('Noch 0 von 2 Fragen heute')).toBeVisible();
    await expect(page.getByText('Du hast heute alle 2 Fragen genutzt.', { exact: false })).toBeVisible();
    await expect(page.getByText('Mit Premium kannst du Jeremy 10 Fragen pro Tag stellen.')).toBeVisible();
    await expect(page.getByLabel('Frage an Jeremy')).toBeDisabled();
    await expect(page.getByLabel('Frage an Jeremy')).toHaveAttribute('placeholder', 'Tageslimit erreicht');
    await expect(page.getByRole('main').getByRole('button', { name: 'Premium holen' })).toBeVisible();
  });
});

test.describe('Jeremy: Premium', () => {
  test.use({ storageState: authFile('prem') });

  test('Premium hat 10 Fragen pro Tag', async ({ page }) => {
    await page.goto('/jeremy');
    await expect(page.getByText('Noch 10 von 10 Fragen heute')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mehr mit Premium' })).toHaveCount(0);
    await expect(page.getByLabel('Frage an Jeremy')).toBeEnabled();
  });

  test('Feature-Flag aus', async ({ page }) => {
    await page.route('**/api/flags/', (route) =>
      route.fulfill({ json: { jeremy_ai: false, two_factor: true } }),
    );
    await page.goto('/jeremy');
    await expect(page.getByText('Jeremy ist gerade nicht verfügbar. Schau später nochmal vorbei.')).toBeVisible();
    await expect(page.getByLabel('Frage an Jeremy')).toBeDisabled();
    await expect(page.getByLabel('Frage an Jeremy')).toHaveAttribute('placeholder', 'Jeremy ist deaktiviert');
    await expect(page.getByText(/Fragen heute/)).toHaveCount(0);
  });
});
