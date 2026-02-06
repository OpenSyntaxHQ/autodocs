import { test, expect } from '@playwright/test';

test('homepage renders stats and navigation', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'API Documentation' })).toBeVisible();
  await expect(page.getByText('Entries', { exact: true })).toBeVisible();
  await expect(page.getByText('Kinds', { exact: true })).toBeVisible();
  await expect(page.getByText('Modules', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Explore the API/i })).toBeVisible();
});
