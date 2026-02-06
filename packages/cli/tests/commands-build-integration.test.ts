import fs from 'fs/promises';
import path from 'path';
import { createTempProject, runCli } from './helpers/cli-helpers';

jest.setTimeout(30000);

describe('build command integration', () => {
  it('builds docs with plugins enabled', async () => {
    const tempDir = await createTempProject({
      'src/index.ts': 'export const value = 1;\n',
      'docs/intro.md': '# Intro\n',
      'autodocs.config.json': JSON.stringify(
        {
          include: ['src/**/*.ts'],
          output: { dir: './docs-dist', format: 'json', clean: true },
          plugins: [
            {
              name: '@opensyntaxhq/autodocs-plugin-markdown',
              options: { sourceDir: 'docs', patterns: ['**/*.md'], frontMatter: false },
            },
          ],
        },
        null,
        2
      ),
    });

    await runCli(['build', '--config', path.join(tempDir, 'autodocs.config.json')], {
      cwd: tempDir,
    });

    const docsPath = path.join(tempDir, 'docs-dist', 'docs.json');
    const raw = await fs.readFile(docsPath, 'utf-8');
    const parsed = JSON.parse(raw) as { entries: Array<{ kind: string }> };

    expect(parsed.entries.length).toBeGreaterThan(0);
    expect(parsed.entries.some((entry) => entry.kind === 'guide')).toBe(true);
  });
});
