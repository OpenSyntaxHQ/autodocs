import fs from 'fs/promises';
import path from 'path';
import { generateHtml } from '../src/generators/html';
import type { DocEntry } from '../src/extractor';
import { createTempDir } from './helpers/fixtures';

describe('HTML Generator', () => {
  it('generates index and detail pages with escaped content', async () => {
    const tempDir = await createTempDir('autodocs-html-');

    const docs: DocEntry[] = [
      {
        id: 'Example',
        name: 'Example',
        kind: 'function',
        fileName: 'src/example.ts',
        position: { line: 1, column: 0 },
        signature: 'function Example<T>(value: T): T',
        documentation: {
          summary: 'Use <b>Example</b>',
          deprecated: 'Use ExampleV2',
          tags: [],
        },
      },
      {
        id: 'Status',
        name: 'Status',
        kind: 'enum',
        fileName: 'src/status.ts',
        position: { line: 1, column: 0 },
        signature: 'enum Status',
        members: [
          {
            name: 'Ready',
            type: 'enum',
            optional: false,
            readonly: true,
            value: 'ready',
          },
        ],
      },
    ];

    await generateHtml(docs, tempDir);

    const indexHtml = await fs.readFile(path.join(tempDir, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('API Documentation');
    expect(indexHtml).toContain('Example');

    const detailHtml = await fs.readFile(
      path.join(tempDir, 'api', 'function', 'Example.html'),
      'utf-8'
    );
    expect(detailHtml).toContain('function Example');
    expect(detailHtml).toContain('Deprecated');
    expect(detailHtml).toContain('Use ExampleV2');
    expect(detailHtml).toContain('Use &lt;b&gt;Example&lt;/b&gt;');

    const enumHtml = await fs.readFile(path.join(tempDir, 'api', 'enum', 'Status.html'), 'utf-8');
    expect(enumHtml).toContain('Members');
    expect(enumHtml).toContain('Ready');
    expect(enumHtml).toContain('ready');
  });
});
