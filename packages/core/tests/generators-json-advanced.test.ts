import fs from 'fs/promises';
import path from 'path';
import { generateJson } from '../src/generators/json';
import type { DocEntry } from '../src/extractor';
import { createTempDir } from './helpers/fixtures';

describe('JSON Generator Advanced', () => {
  it('normalizes paths and writes stats', async () => {
    const tempDir = await createTempDir('autodocs-json-');
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

    await generateJson(docs, tempDir, { pretty: true, rootDir });

    const payload = JSON.parse(await fs.readFile(path.join(tempDir, 'docs.json'), 'utf-8')) as {
      meta: { stats: { total: number } };
      entries: Array<{ fileName: string }>;
    };

    expect(payload.meta.stats.total).toBe(1);
    expect(payload.entries[0]?.fileName).toBe('src/example.ts');
  });

  it('writes split output by module', async () => {
    const tempDir = await createTempDir('autodocs-json-');
    const docs: DocEntry[] = [
      {
        id: 'Alpha',
        name: 'Alpha',
        kind: 'function',
        fileName: 'src/alpha.ts',
        position: { line: 1, column: 0 },
        signature: 'function Alpha(): void',
      },
    ];

    await generateJson(docs, tempDir, { splitByModule: true, pretty: true });

    const moduleFile = path.join(tempDir, 'src_alpha.json');
    const moduleJson = JSON.parse(await fs.readFile(moduleFile, 'utf-8')) as {
      module: string;
      entries: Array<{ name: string }>;
    };

    expect(moduleJson.module).toBe('src/alpha');
    expect(moduleJson.entries[0]?.name).toBe('Alpha');
  });
});
