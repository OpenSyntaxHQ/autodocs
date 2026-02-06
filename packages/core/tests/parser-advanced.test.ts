import path from 'path';
import ts from 'typescript';
import { createProgram } from '../src/parser';
import { createTempDir, writeTempFile } from './helpers/fixtures';

describe('Parser Advanced', () => {
  it('respects compiler options from tsconfig', async () => {
    const tempDir = await createTempDir('autodocs-parser-');
    const tsconfigPath = await writeTempFile(
      tempDir,
      'tsconfig.json',
      JSON.stringify({
        compilerOptions: {
          target: 'ES5',
          moduleResolution: 'Node',
          strict: true,
        },
      })
    );
    const entryPath = await writeTempFile(tempDir, 'src/index.ts', 'export const x = 1;');

    const result = createProgram([entryPath], { configFile: tsconfigPath });

    expect(result.program.getCompilerOptions().target).toBe(ts.ScriptTarget.ES5);
    expect(result.program.getCompilerOptions().moduleResolution).toBe(
      ts.ModuleResolutionKind.Node10
    );
  });

  it('collects diagnostics for syntax errors', async () => {
    const tempDir = await createTempDir('autodocs-parser-');
    const entryPath = await writeTempFile(tempDir, 'src/index.ts', 'export const x = ;');

    const result = createProgram([entryPath]);

    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('reports missing imports in diagnostics', async () => {
    const tempDir = await createTempDir('autodocs-parser-');
    const entryPath = await writeTempFile(
      tempDir,
      'src/index.ts',
      "import { Missing } from './missing'; export const x = Missing;"
    );

    const result = createProgram([entryPath]);

    const diagnosticText = result.diagnostics
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' '))
      .join(' ');
    expect(diagnosticText).toContain('Cannot find module');
  });

  it('returns rootDir based on entry file', async () => {
    const tempDir = await createTempDir('autodocs-parser-');
    const entryPath = await writeTempFile(tempDir, 'src/index.ts', 'export const x = 1;');

    const result = createProgram([entryPath]);

    expect(path.resolve(result.rootDir)).toBe(path.resolve(path.dirname(entryPath)));
  });
});
