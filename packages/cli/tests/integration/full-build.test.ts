import fs from 'fs/promises';
import path from 'path';
import { createTempProject, runCli } from '../helpers/cli-helpers';

jest.setTimeout(30000);

describe('full build integration', () => {
  it('generates docs.json with JSDoc content', async () => {
    const tempDir = await createTempProject({
      'src/index.ts': `/**\n * Adds two numbers\n */\nexport function add(a: number, b: number) {\n  return a + b;\n}\n`,
      'autodocs.config.json': JSON.stringify(
        {
          include: ['src/**/*.ts'],
          output: { dir: './docs-dist', format: 'json', clean: true },
        },
        null,
        2
      ),
    });

    await runCli(['build', '--config', path.join(tempDir, 'autodocs.config.json')], {
      cwd: tempDir,
    });

    const docsPath = path.join(tempDir, 'docs-dist', 'docs.json');
    const docs = JSON.parse(await fs.readFile(docsPath, 'utf-8')) as {
      entries: Array<{ name: string; documentation?: { summary?: string } }>;
    };

    const entry = docs.entries.find((e) => e.name === 'add');
    expect(entry?.documentation?.summary).toContain('Adds two numbers');
  });
});
