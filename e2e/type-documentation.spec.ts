import { test, expect } from './coverage';

test('type documentation page renders signature', async ({ page }) => {
  const docsResponse = await page.request.get('/docs.json');
  const docsJson = (await docsResponse.json()) as {
    entries: Array<{ id: string; name: string; kind: string }>;
  };

  const entry = docsJson.entries.find((doc) => doc.kind === 'type' && doc.name === 'DocKind');
  if (!entry) {
    throw new Error('Expected DocKind type entry to exist in docs.json');
  }

  const slug = entry.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  await page.goto(`/${entry.kind}/${entry.id}/${slug}`);

  await expect(page.getByRole('heading', { name: 'DocKind' })).toBeVisible();
  await expect(page.getByText('Signature')).toBeVisible();
});
