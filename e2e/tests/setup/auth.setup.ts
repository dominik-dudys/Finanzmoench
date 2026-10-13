import { test as setup } from '@playwright/test';
import { loginWithEmailCode } from '../../helpers/auth';
import { authFile, personas, STORED_PERSONAS } from '../../helpers/personas';

for (const key of STORED_PERSONAS) {
  setup(`Login ${key}`, async ({ page }) => {
    await loginWithEmailCode(page, personas[key].email);
    await page.context().storageState({ path: authFile(key) });
  });
}
