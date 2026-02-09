import { test, expect } from './coverage';

test('homepage loads within acceptable time', async ({ page }) => {
  const maxDurationMs = Number(process.env.E2E_HOME_LOAD_BUDGET_MS || '5000');
  const start = Date.now();
  await page.goto('/', { waitUntil: 'load' });
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(maxDurationMs);
});
