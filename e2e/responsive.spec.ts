import { test, expect } from '@playwright/test';

test('mobile navigation shows menu button', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: /Open navigation/i })).toBeVisible();
});
