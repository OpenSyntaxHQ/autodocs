import path from 'path';
import { EventEmitter } from 'events';
import { Command } from 'commander';

jest.mock('glob', () => ({
  glob: jest.fn(() => Promise.resolve([path.resolve('/tmp/example.ts')])),
}));

jest.mock('../src/config', () => ({
  loadConfig: jest.fn(),
  resolveConfigPaths: jest.fn(),
}));

jest.mock('../src/commands/build', () => ({
  buildReactUI: jest.fn(),
  loadPlugins: jest.fn(),
  writeStaticDocs: jest.fn(),
}));

jest.mock('@opensyntaxhq/autodocs-core', () => {
  const pluginInstances: Array<{ cleanup: jest.Mock; runHook: jest.Mock }> = [];
  return {
    generateJson: jest.fn(),
    generateMarkdown: jest.fn(),
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
      constructor() {
        pluginInstances.push(this);
      }
    },
    FileCache: jest.fn(),
    incrementalBuild: jest.fn(),
    __pluginInstances: pluginInstances,
  };
});

const watcherInstances: Array<FileWatcherMock> = [];

class FileWatcherMock extends EventEmitter {
  start = jest.fn();
  stop = jest.fn(() => Promise.resolve());
  options: unknown;

  constructor(options: unknown) {
    super();
    this.options = options;
    watcherInstances.push(this);
  }
}

jest.mock('../src/utils/watcher', () => ({
  FileWatcher: FileWatcherMock,
}));

import { glob } from 'glob';
import { runBuild, registerWatch } from '../src/commands/watch';
import { buildReactUI, writeStaticDocs } from '../src/commands/build';
import { loadConfig, resolveConfigPaths } from '../src/config';
import { generateJson, generateMarkdown, incrementalBuild } from '@opensyntaxhq/autodocs-core';

const globMock = glob as unknown as jest.MockedFunction<typeof glob>;

describe('watch command build modes', () => {
  const baseConfig = {
    include: ['src/**/*.ts'],
    output: { dir: '/tmp/out', format: 'static', clean: true },
    theme: { name: 'default' },
    cache: false,
  };

  beforeEach(() => {
    watcherInstances.length = 0;
    jest.clearAllMocks();
    process.removeAllListeners('SIGINT');
    const coreModule: { __pluginInstances?: Array<unknown> } = jest.requireMock(
      '@opensyntaxhq/autodocs-core'
    );
    if (coreModule.__pluginInstances) {
      coreModule.__pluginInstances.length = 0;
    }
  });

  it('runs full build when mode is full', async () => {
    await runBuild({
      config: baseConfig as import('../src/config').AutodocsConfig,
      configDir: '/tmp',
      mode: 'full',
    });

    expect(buildReactUI).toHaveBeenCalled();
  });

  it('writes docs-only when mode is docs-only', async () => {
    await runBuild({
      config: baseConfig as import('../src/config').AutodocsConfig,
      configDir: '/tmp',
      mode: 'docs-only',
    });

    expect(writeStaticDocs).toHaveBeenCalled();
  });

  it('returns early when no files are found', async () => {
    globMock.mockResolvedValueOnce([]);

    await runBuild({
      config: baseConfig as import('../src/config').AutodocsConfig,
      configDir: '/tmp',
      mode: 'full',
    });

    expect(buildReactUI).not.toHaveBeenCalled();
    expect(writeStaticDocs).not.toHaveBeenCalled();
  });

  it('uses incremental build cache and writes JSON output', async () => {
    const config = {
      ...baseConfig,
      cache: true,
      output: { ...baseConfig.output, format: 'json' },
    } as import('../src/config').AutodocsConfig;

    (incrementalBuild as jest.Mock).mockResolvedValueOnce({
      docs: [
        {
          id: 'Example',
          name: 'Example',
          kind: 'function',
          fileName: 'src/example.ts',
          source: { file: 'src/example.ts', line: 1, column: 0 },
          position: { line: 1, column: 0 },
          signature: 'function Example(): void',
        },
      ],
      rootDir: '/tmp',
      diagnostics: [],
      changedFiles: ['src/example.ts'],
      fromCache: 0,
    });

    await runBuild({
      config,
      configDir: '/tmp',
      mode: 'full',
    });

    expect(incrementalBuild).toHaveBeenCalled();
    expect(generateJson).toHaveBeenCalled();
  });

  it('generates markdown output when format is markdown', async () => {
    const config = {
      ...baseConfig,
      cache: false,
      output: { ...baseConfig.output, format: 'markdown' },
    } as import('../src/config').AutodocsConfig;

    await runBuild({
      config,
      configDir: '/tmp',
      mode: 'full',
    });

    expect(generateMarkdown).toHaveBeenCalled();
  });

  it('cleans up plugin manager on build failure', async () => {
    const config = {
      ...baseConfig,
      output: { ...baseConfig.output, format: 'static' },
    } as import('../src/config').AutodocsConfig;

    (buildReactUI as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await runBuild({
      config,
      configDir: '/tmp',
      mode: 'full',
    });

    const coreModule = await import('@opensyntaxhq/autodocs-core');
    const instances = (
      coreModule as unknown as { __pluginInstances?: Array<{ cleanup: jest.Mock }> }
    ).__pluginInstances;

    expect(instances?.[0]?.cleanup).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('skips watcher setup when config is missing', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(null);

    const program = new Command();
    registerWatch(program);

    await program.parseAsync(['node', 'cli', 'watch']);

    expect(watcherInstances).toHaveLength(0);
  });

  it('logs when watcher is ready', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(baseConfig);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(baseConfig);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const program = new Command();
    registerWatch(program);

    await program.parseAsync(['node', 'cli', 'watch']);

    const watcher = watcherInstances[0];
    if (!watcher) {
      throw new Error('Watcher was not initialized');
    }
    watcher.emit('ready');

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Watching for changes'));

    logSpy.mockRestore();
  });

  it('triggers docs-only rebuild on change', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(baseConfig);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(baseConfig);

    const program = new Command();
    registerWatch(program);

    await program.parseAsync(['node', 'cli', 'watch']);

    const watcher = watcherInstances[0];
    if (!watcher) {
      throw new Error('Watcher was not initialized');
    }
    watcher.emit('change', '/tmp/example.ts');

    await new Promise((resolve) => setImmediate(resolve));

    expect(writeStaticDocs).toHaveBeenCalled();
  });

  it('handles SIGINT by stopping watcher and exiting', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(baseConfig);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(baseConfig);

    const program = new Command();
    registerWatch(program);

    await program.parseAsync(['node', 'cli', 'watch']);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as never);

    process.emit('SIGINT');

    await new Promise((resolve) => setImmediate(resolve));

    expect(watcherInstances).toHaveLength(1);
    const watcher = watcherInstances[0];
    if (!watcher) {
      throw new Error('Watcher was not initialized');
    }
    expect(watcher.stop).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });

  it('exits when watch configuration load fails', async () => {
    (loadConfig as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    const program = new Command();
    registerWatch(program);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${String(code ?? '')}`);
    }) as never);

    await expect(program.parseAsync(['node', 'cli', 'watch'])).rejects.toThrow('exit:1');

    exitSpy.mockRestore();
  });
});
