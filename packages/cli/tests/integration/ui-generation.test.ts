import fs from 'fs/promises';
import path from 'path';
import { writeStaticDocs } from '../../src/commands/build';
import type { DocEntry } from '@opensyntaxhq/autodocs-core';
import { createTempDir } from '../helpers/temp';

jest.setTimeout(20000);

describe('UI generation integration', () => {
  it('writes docs.json and config.json with theme', async () => {
    const tempDir = await createTempDir('autodocs-ui-');
    const outputDir = path.join(tempDir, 'out');

    const docs: DocEntry[] = [
      {
        id: 'Example',
        name: 'Example',
        kind: 'function',
        fileName: path.join(tempDir, 'src', 'example.ts'),
        source: { file: path.join(tempDir, 'src', 'example.ts'), line: 1, column: 0 },
        position: { line: 1, column: 0 },
        signature: 'function Example(): void',
      },
    ];

    await writeStaticDocs(docs, outputDir, {
      rootDir: tempDir,
      configDir: tempDir,
      uiConfig: {
        theme: { name: 'default', primaryColor: '#111111' },
        features: { search: false },
        sidebar: [{ title: 'Guide', path: '/docs/intro.md' }],
      },
      siteUrl: 'https://example.com',
      siteName: 'Autodocs',
    });

    const configRaw = await fs.readFile(path.join(outputDir, 'config.json'), 'utf-8');
    const config = JSON.parse(configRaw) as { theme?: { primaryColor?: string } };
    expect(config.theme?.primaryColor).toBe('#111111');

    const docsRaw = await fs.readFile(path.join(outputDir, 'docs.json'), 'utf-8');
    const docsJson = JSON.parse(docsRaw) as { entries: Array<{ name: string }> };
    expect(docsJson.entries[0]?.name).toBe('Example');
  });
});
