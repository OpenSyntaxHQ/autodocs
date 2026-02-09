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

  it('does not mutate entry identity fields or add entries', async () => {
    const docs: DocEntry[] = [
      {
        id: 'abc12345',
        name: 'SomeType',
        kind: 'type',
        fileName: 'src/types.ts',
        module: 'src/types',
        position: { line: 10, column: 0 },
        signature: 'type SomeType = { value: string }',
        documentation: {
          summary: 'A sample type',
          tags: [],
          examples: [{ code: 'const x: SomeType = { value: "ok" };', language: 'ts' }],
        },
      },
    ];

    const plugin = examplesPlugin({ validate: false });
    const before = { id: docs[0].id, kind: docs[0].kind, name: docs[0].name };
    const result = (await plugin.afterExtract?.(docs)) || docs;

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(before.id);
    expect(result[0].kind).toBe(before.kind);
    expect(result[0].name).toBe(before.name);
  });

  it('skips output generation when entries contain no examples', async () => {
    const tempDir = await createTempDir('autodocs-ex-no-output-');
    const outputDir = path.join(tempDir, 'docs');

    const docs: DocEntry[] = [
      {
        id: 'NoExamples',
        name: 'NoExamples',
        kind: 'interface',
        fileName: 'src/no-examples.ts',
        module: 'src/no-examples',
        position: { line: 1, column: 0 },
        signature: 'interface NoExamples { value: string }',
        documentation: {
          summary: 'No examples here',
          tags: [],
        },
      },
    ];

    const plugin = examplesPlugin({ outputDir: 'examples' });
    await plugin.afterExtract?.(docs);
    await plugin.afterGenerate?.(outputDir);

    await expect(fs.access(path.join(outputDir, 'examples', 'examples.json'))).rejects.toThrow();
  });
});
