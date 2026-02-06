import fs from 'fs/promises';
import path from 'path';
import { generateMarkdown } from '../src/generators/markdown';
import type { DocEntry } from '../src/extractor';
import { createTempDir } from './helpers/fixtures';

describe('Markdown Generator', () => {
  it('generates markdown with tables and examples', async () => {
    const tempDir = await createTempDir('autodocs-md-');

    const docs: DocEntry[] = [
      {
        id: 'Example',
        name: 'Example',
        kind: 'function',
        fileName: 'src/example.ts',
        position: { line: 1, column: 0 },
        signature: 'function Example(value: string): number',
        parameters: [
          {
            name: 'value',
            type: 'string',
            optional: false,
            rest: false,
          },
        ],
        returnType: { text: 'number', kind: 'number' },
        documentation: {
          summary: 'Example summary',
          tags: [],
          examples: [{ language: 'typescript', code: 'Example("test")' }],
        },
      },
    ];

    await generateMarkdown(docs, tempDir);

    const readme = await fs.readFile(path.join(tempDir, 'README.md'), 'utf-8');
    expect(readme).toContain('# API Documentation');

    const entry = await fs.readFile(path.join(tempDir, 'api', 'function', 'Example.md'), 'utf-8');
    expect(entry).toContain('## Signature');
    expect(entry).toContain('## Parameters');
    expect(entry).toContain('## Returns');
    expect(entry).toContain('## Examples');
    expect(entry).toContain('```typescript');
  });
});
