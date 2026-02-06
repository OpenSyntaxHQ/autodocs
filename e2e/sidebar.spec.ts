import { test, expect } from '@playwright/test';

test('sidebar shows overview and groups', async ({ page }) => {
  await page.goto('/');

  const openNav = page.getByRole('button', { name: /open navigation/i });
  if (await openNav.isVisible()) {
    await openNav.click();
  }

  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(nav.getByRole('heading', { name: /functions/i }).first()).toBeVisible();
});
