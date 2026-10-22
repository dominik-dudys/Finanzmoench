import { expect, type Page } from '@playwright/test';
import { waitForCode } from './mailpit';
import { PASSWORD } from './personas';

export async function fillOtp(page: Page, code: string) {
  await page.locator('input[data-input-otp]').fill(code);
}

// Das Frontend holt das CSRF-Cookie beim Laden per Session-Request.
// Unter Last antwortet das Backend langsam, deshalb erst absenden, wenn das Cookie da ist.
export async function waitForCsrfCookie(page: Page) {
  await expect
    .poll(async () => (await page.context().cookies()).some((c) => c.name === 'csrftoken'), { timeout: 20_000 })
    .toBe(true);
}

export async function submitPasswordLogin(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await waitForCsrfCookie(page);
  const form = page.locator('form');
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Passwort', { exact: true }).fill(password);
  await form.getByRole('button', { name: 'Anmelden', exact: true }).click();
}

export async function loginWithEmailCode(page: Page, email: string, password = PASSWORD) {
  const since = Date.now();
  await submitPasswordLogin(page, email, password);
  await expect(page).toHaveURL(/\/login\/code$/);
  await expect(page.getByRole('heading', { name: 'Anmeldung bestätigen' })).toBeVisible();
  const code = await waitForCode(email, since);
  await fillOtp(page, code);
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Benutzermenü' }).click();
  await page.getByRole('menuitem', { name: 'Abmelden' }).click();
  await expect(page.getByRole('button', { name: 'Benutzermenü' })).toHaveCount(0);
  await expect(page).toHaveURL(/localhost:5173\/(login)?$/);
}
