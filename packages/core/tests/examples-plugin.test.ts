import fs from 'fs/promises';
import path from 'path';
import examplesPlugin from '../../plugins/examples/src/index';
import type { DocEntry } from '../src/extractor';
import { createTempDir } from './helpers/fixtures';

describe('Examples plugin', () => {
  it('validates examples and emits example files', async () => {
    const tempDir = await createTempDir('autodocs-ex-');
    const outputDir = path.join(tempDir, 'docs');

    const docs: DocEntry[] = [
      {
        id: 'Example',
        name: 'Example',
        kind: 'function',
        fileName: 'example.ts',
        position: { line: 1, column: 0 },
        signature: 'function Example(): void',
        documentation: {
          summary: 'Example',
          tags: [],
          examples: [
            {
              code: "const name: string = 'autodocs';",
              language: 'ts',
            },
          ],
        },
      },
    ];

    const plugin = examplesPlugin({ validate: true, outputDir: 'examples' });
    const result = (await plugin.afterExtract?.(docs)) || docs;
    expect(result).toHaveLength(1);

    await plugin.afterGenerate?.(outputDir);

    const examplesDir = path.join(outputDir, 'examples');
    const files = await fs.readdir(examplesDir);
    expect(files.some((file) => file.endsWith('.ts'))).toBe(true);
    expect(files).toContain('examples.json');
  });

  it('throws on invalid examples when validate is enabled', async () => {
    const docs: DocEntry[] = [
      {
        id: 'Bad',
        name: 'Bad',
        kind: 'function',
        fileName: 'bad.ts',
        position: { line: 1, column: 0 },
        signature: 'function Bad(): void',
        documentation: {
          summary: 'Bad',
          tags: [],
          examples: [
            {
              code: 'const missing: string = 123;',
              language: 'ts',
            },
          ],
        },
      },
    ];

    const plugin = examplesPlugin({ validate: true });
    await expect(plugin.afterExtract?.(docs)).rejects.toThrow('TypeScript errors');
  });

  it('allows examples that reference the documented symbol', async () => {
    const docs: DocEntry[] = [
      {
        id: 'formatDate',
        name: 'formatDate',
        kind: 'function',
        fileName: 'format.ts',
        position: { line: 1, column: 0 },
        signature: 'function formatDate(date: Date): string',
        documentation: {
          summary: 'Format a date',
          tags: [],
          examples: [
            {
              code: 'const formatted = formatDate(new Date());\nconsole.log(formatted);',
              language: 'ts',
            },
          ],
        },
      },
    ];

    const plugin = examplesPlugin({ validate: true });
    await expect(plugin.afterExtract?.(docs)).resolves.toBeTruthy();
  });
});
