import { test, expect } from '@playwright/test';

test('type documentation page renders signature', async ({ page }) => {
  await page.goto('/type/DocKind');

  await expect(page.getByRole('heading', { name: 'DocKind' })).toBeVisible();
  await expect(page.getByText('Signature')).toBeVisible();
});
