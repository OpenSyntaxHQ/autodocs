import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { generateJson } from '../src/generators/json';
import { DocEntry } from '../src/extractor';

describe('JSON generator', () => {
  it('writes docs.json with meta and normalized entries', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autodocs-json-'));
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

    const raw = await fs.readFile(path.join(tempDir, 'docs.json'), 'utf-8');
    const payload = JSON.parse(raw) as {
      meta: { stats: { total: number } };
      entries: DocEntry[];
    };

    expect(payload.meta.stats.total).toBe(1);
    expect(payload.entries).toHaveLength(1);
    expect(payload.entries[0]?.fileName).toBe('src/example.ts');
    expect(payload.entries[0]?.module).toBe('src/example');
    expect(payload.entries[0]?.source?.file).toBe('src/example.ts');
  });
});
