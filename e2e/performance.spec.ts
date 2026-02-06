import { test, expect } from '@playwright/test';

test('homepage loads within acceptable time', async ({ page }) => {
  const start = Date.now();
  await page.goto('/', { waitUntil: 'load' });
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(15000);
});
