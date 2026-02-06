import { test, expect } from '@playwright/test';

test('theme toggle updates document class', async ({ page }) => {
  await page.goto('/');

  const toggle = page.getByRole('button', { name: /Toggle theme/i });
  await toggle.click();

  await expect(page.locator('html')).toHaveClass(/dark/);
});
