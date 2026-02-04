import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import type { DocEntry } from '@opensyntaxhq/autodocs-core';

jest.mock('child_process', () => ({
  exec: jest.fn(
    (
      _command: string,
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void
    ) => {
      callback(null, '', '');
    }
  ),
}));

import { buildReactUI } from '../src/commands/build';

const createSpinner = () => ({
  text: '',
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
});

describe('buildReactUI', () => {
  it('writes docs.json and config.json into the output directory', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autodocs-cli-'));
    const uiDir = path.join(tempDir, 'ui');
    const distDir = path.join(uiDir, 'dist');
    await fs.mkdir(distDir, { recursive: true });
    await fs.writeFile(path.join(distDir, 'index.html'), '<html></html>', 'utf-8');

    const rootDir = path.join(tempDir, 'project');
    const filePath = path.join(rootDir, 'src', 'example.ts');

    const docs: DocEntry[] = [
      {
        id: 'Example',
        name: 'Example',
        kind: 'function',
        fileName: filePath,
        source: { file: filePath, line: 1, column: 0 },
        position: { line: 1, column: 0 },
        signature: 'function Example(): void',
      },
    ];

    const logoPath = path.join(tempDir, 'logo.svg');
    const faviconPath = path.join(tempDir, 'favicon.svg');
    await fs.writeFile(logoPath, '<svg></svg>', 'utf-8');
    await fs.writeFile(faviconPath, '<svg></svg>', 'utf-8');

    const outputDir = path.join(tempDir, 'out');
    const spinner = createSpinner() as unknown as ReturnType<typeof import('ora')>;

    await buildReactUI(docs, outputDir, spinner, {
      rootDir,
      uiDir,
      uiConfig: {
        theme: { primaryColor: '#123456', logo: logoPath, favicon: faviconPath },
        features: { search: false },
        sidebar: [{ title: 'Guide', path: '/guide' }],
      },
    });

    const docsJson = JSON.parse(await fs.readFile(path.join(outputDir, 'docs.json'), 'utf-8')) as {
      entries: DocEntry[];
      meta: { stats: { total: number } };
    };
    expect(docsJson.meta.stats.total).toBe(1);
    expect(docsJson.entries).toHaveLength(1);
    expect(docsJson.entries[0]?.module).toBe('src/example');

    const configJson = JSON.parse(
      await fs.readFile(path.join(outputDir, 'config.json'), 'utf-8')
    ) as {
      theme?: { primaryColor?: string; logo?: string; favicon?: string };
      features?: { search?: boolean };
      sidebar?: Array<{ title: string }>;
    };
    expect(configJson.theme?.primaryColor).toBe('#123456');
    expect(configJson.theme?.logo).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(configJson.theme?.favicon).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(configJson.features?.search).toBe(false);
    expect(configJson.sidebar?.[0]?.title).toBe('Guide');

    const indexHtml = await fs.readFile(path.join(outputDir, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('<html>');
  });
});
