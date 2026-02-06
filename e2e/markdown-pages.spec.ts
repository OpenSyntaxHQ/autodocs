import { test, expect } from '@playwright/test';

test('markdown pages render content', async ({ page }) => {
  await page.goto('/docs/intro.md');

  await expect(page.getByRole('heading', { name: 'Getting Started' })).toBeVisible();
  await expect(page.getByText('Install the CLI')).toBeVisible();
});
