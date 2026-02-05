import path from 'path';

jest.mock('glob', () => ({
  glob: jest.fn(() => Promise.resolve([path.resolve('/tmp/example.ts')])),
}));

jest.mock('../src/commands/build', () => ({
  buildReactUI: jest.fn(),
  loadPlugins: jest.fn(),
  writeStaticDocs: jest.fn(),
}));

jest.mock('@opensyntaxhq/autodocs-core', () => {
  return {
    createProgram: jest.fn(() => ({
      program: {},
      sourceFiles: [],
      diagnostics: [],
      rootDir: '/tmp',
    })),
    extractDocs: jest.fn(() => []),
    PluginManager: class {
      runHook = jest.fn((_hook: string, value: unknown) => Promise.resolve(value));
      cleanup = jest.fn();
    },
    FileCache: jest.fn(),
    incrementalBuild: jest.fn(),
  };
});

import { runBuild } from '../src/commands/watch';
import { writeStaticDocs } from '../src/commands/build';

describe('watch build pipeline', () => {
  it('writes docs-only output for static format', async () => {
    const config = {
      include: ['src/**/*.ts'],
      output: { dir: '/tmp/out', format: 'static', clean: true },
      theme: { name: 'default' },
      cache: false,
    };

    await runBuild({
      config: config as import('../src/config').AutodocsConfig,
      configDir: '/tmp',
      mode: 'docs-only',
    });

    expect(writeStaticDocs).toHaveBeenCalled();
  });
});
