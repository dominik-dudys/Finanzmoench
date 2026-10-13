import { expect, test } from '@playwright/test';

const PROTECTED = ['/dashboard', '/household', '/income', '/cost', '/kategorien', '/jeremy', '/profil', '/einstellungen'];

for (const route of PROTECTED) {
  test(`${route} leitet ohne Login auf /login um`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Willkommen zurück' })).toBeVisible();
  });
}

test('geschützte API antwortet ohne Login mit 401 oder 403', async ({ request }) => {
  const res = await request.get('/api/accounts/me/');
  expect([401, 403]).toContain(res.status());
});
