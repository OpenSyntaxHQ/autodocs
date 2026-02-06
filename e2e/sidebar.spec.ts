import { test, expect } from '@playwright/test';

test('sidebar shows overview and groups', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Overview')).toBeVisible();
  await expect(page.getByText(/functions/i)).toBeVisible();
});
