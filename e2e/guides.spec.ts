import { test, expect } from './coverage';

test('guide navigation uses stable short IDs', async ({ page }) => {
  await page.goto('/');

  const openNav = page.getByRole('button', { name: /open navigation/i });
  if (await openNav.isVisible()) {
    await openNav.click();
  }

  await page.getByRole('link', { name: 'README' }).first().click();

  await expect(page).toHaveURL(/\/guide\/[0-9a-f]{8}\/readme$/i);
});
