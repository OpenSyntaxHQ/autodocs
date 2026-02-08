import { test, expect } from './coverage';

test('search navigates to result', async ({ page }) => {
  await page.goto('/');

  await page
    .getByRole('button', { name: /Search/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByPlaceholder('Type a command or search...').fill('DocKind');
  await expect(dialog.getByText('DocKind').first()).toBeVisible();

  await dialog.getByText('DocKind').first().click();
  await expect(page).toHaveURL(/\/type\/[0-9a-f]{8}\/dockind$/);
});
