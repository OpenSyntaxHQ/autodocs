import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { Command } from 'commander';
import type { Ora } from 'ora';
import type { AutodocsConfig } from '../src/config';
import { createTempDir } from './helpers/temp';
import type { PluginManager } from '@opensyntaxhq/autodocs-core';

const spinner = {
  text: '',
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
  info: jest.fn().mockReturnThis(),
} as unknown as Ora;

jest.mock('ora', () => () => spinner);

jest.mock('glob', () => ({
  glob: jest.fn(),
}));

jest.mock('../src/config', () => ({
  loadConfig: jest.fn(),
  resolveConfigPaths: jest.fn(),
}));

const pluginManagerInstances: Array<{ cleanup: jest.Mock; runHook: jest.Mock }> = [];

jest.mock('@opensyntaxhq/autodocs-core', () => ({
  VERSION: '0.0.0-test',
  generateJson: jest.fn(),
  generateMarkdown: jest.fn(),
  generateStaticSite: jest.fn(),
  generateHtml: jest.fn(),
  createProgram: jest.fn(),
  extractDocs: jest.fn(),
  incrementalBuild: jest.fn(),
  FileCache: jest.fn(),
  PluginManager: class {
    runHook = jest.fn((_hook: string, value: unknown) => value);
    cleanup = jest.fn();
    constructor() {
      pluginManagerInstances.push(this);
    }
  },
}));

import { glob } from 'glob';
import { loadConfig, resolveConfigPaths } from '../src/config';
import {
  createProgram,
  extractDocs,
  generateHtml,
  generateJson,
  generateMarkdown,
  incrementalBuild,
} from '@opensyntaxhq/autodocs-core';
import { loadPlugins, writeStaticDocs, buildReactUI, registerBuild } from '../src/commands/build';

const globMock = glob as unknown as jest.MockedFunction<typeof glob>;

describe('build helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pluginManagerInstances.length = 0;
  });

  it('loads plugins from relative path and module name', async () => {
    const tempDir = await createTempDir('autodocs-plugin-');
    const pluginPath = path.join(tempDir, 'plugin.cjs');
    await fs.writeFile(
      pluginPath,
      "module.exports = () => ({ name: 'plugin-relative' });\n",
      'utf-8'
    );

    const loadPlugin = jest.fn();
    const manager = {
      loadPlugin,
      runHook: jest.fn(),
      cleanup: jest.fn(),
      plugins: [],
      context: {},
    } as unknown as PluginManager;

    await loadPlugins(manager, ['./plugin.cjs', 'autodocs-plugin-remote'], tempDir);

    expect(loadPlugin).toHaveBeenCalledWith(expect.objectContaining({ name: 'plugin-relative' }));
    expect(loadPlugin).toHaveBeenCalledWith('autodocs-plugin-remote');
  });

  it('loads plugins from file URLs and config objects', async () => {
    const tempDir = await createTempDir('autodocs-plugin-');
    const filePluginPath = path.join(tempDir, 'plugin-file.cjs');
    const factoryPluginPath = path.join(tempDir, 'plugin-factory.cjs');

    await fs.writeFile(filePluginPath, "module.exports = { name: 'plugin-file' };\n", 'utf-8');
    await fs.writeFile(
      factoryPluginPath,
      "module.exports = (options = {}) => ({ name: 'plugin-factory', options });\n",
      'utf-8'
    );

    const loadPlugin = jest.fn();
    const manager = {
      loadPlugin,
      runHook: jest.fn(),
      cleanup: jest.fn(),
      plugins: [],
      context: {},
    } as unknown as PluginManager;

    await loadPlugins(
      manager,
      [
        pathToFileURL(filePluginPath).href,
        { name: './plugin-factory.cjs', options: { foo: 'bar' } },
      ],
      tempDir
    );

    expect(loadPlugin).toHaveBeenCalledWith(expect.objectContaining({ name: 'plugin-file' }));
    expect(loadPlugin).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'plugin-factory', options: { foo: 'bar' } })
    );
  });

  it('writes config payload and copies sidebar markdown', async () => {
    const tempDir = await createTempDir('autodocs-write-');
    const configDir = path.join(tempDir, 'config');
    const docsDir = path.join(configDir, 'docs');
    await fs.mkdir(docsDir, { recursive: true });
    await fs.writeFile(path.join(docsDir, 'intro.md'), '# Intro', 'utf-8');

    const logoPath = path.join(tempDir, 'logo.svg');
    await fs.writeFile(logoPath, '<svg></svg>', 'utf-8');

    const outputDir = path.join(tempDir, 'out');

    await writeStaticDocs(
      [
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
      outputDir,
      {
        configDir,
        uiConfig: {
          theme: {
            name: 'default',
            primaryColor: '#000000',
            logo: logoPath,
            favicon: './favicon.svg',
          },
          sidebar: [
            { title: 'Intro', path: '/docs/intro.md' },
            { title: 'Remote', path: 'https://example.com/remote.md' },
          ],
        },
      }
    );

    const configJson = JSON.parse(
      await fs.readFile(path.join(outputDir, 'config.json'), 'utf-8')
    ) as { theme?: { logo?: string; favicon?: string } };

    expect(configJson.theme?.logo).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(configJson.theme?.favicon).toBe('./favicon.svg');

    const copied = await fs.readFile(path.join(outputDir, 'docs', 'intro.md'), 'utf-8');
    expect(copied).toContain('# Intro');
  });

  it('handles missing asset files and keeps data URLs intact', async () => {
    const tempDir = await createTempDir('autodocs-assets-');
    const outputDir = path.join(tempDir, 'out');
    const missingLogo = path.join(tempDir, 'missing.svg');

    await writeStaticDocs(
      [
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
      outputDir,
      {
        configDir: tempDir,
        uiConfig: {
          theme: {
            name: 'default',
            primaryColor: '#000000',
            logo: missingLogo,
            favicon: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
          },
        },
      }
    );

    const configJson = JSON.parse(
      await fs.readFile(path.join(outputDir, 'config.json'), 'utf-8')
    ) as { theme?: { logo?: string; favicon?: string } };

    expect(configJson.theme?.logo).toBeUndefined();
    expect(configJson.theme?.favicon).toBe('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
  });

  it('falls back to HTML generator when UI package is missing', async () => {
    const outputDir = path.join(await createTempDir('autodocs-build-'), 'out');

    await buildReactUI(
      [
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
      outputDir,
      spinner,
      {
        uiDir: path.join(outputDir, 'missing-ui'),
        uiConfig: { theme: { name: 'default' } },
      }
    );

    expect(generateHtml).toHaveBeenCalled();
  });

  it('falls back to HTML generator when custom uiDir has no dist folder', async () => {
    const tempDir = await createTempDir('autodocs-build-');
    const uiDir = path.join(tempDir, 'ui');
    await fs.mkdir(uiDir, { recursive: true });

    await buildReactUI(
      [
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
      path.join(tempDir, 'out'),
      spinner,
      {
        uiDir,
        uiConfig: { theme: { name: 'default' } },
      }
    );

    expect(generateHtml).toHaveBeenCalled();
  });
});

describe('registerBuild', () => {
  const baseConfig: AutodocsConfig = {
    include: ['src/**/*.ts'],
    output: { dir: '/tmp/out', format: 'json', clean: true },
    theme: { name: 'default' },
    cache: false,
  } as AutodocsConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    pluginManagerInstances.length = 0;
  });

  it('exits when no config is found', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(null);

    const program = new Command();
    registerBuild(program);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${String(code ?? '')}`);
    }) as never);

    await expect(program.parseAsync(['node', 'cli', 'build'])).rejects.toThrow('exit:1');

    exitSpy.mockRestore();
  });

  it('exits when no files are found', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(baseConfig);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(baseConfig);
    globMock.mockResolvedValueOnce([]);

    const program = new Command();
    registerBuild(program);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${String(code ?? '')}`);
    }) as never);

    await expect(program.parseAsync(['node', 'cli', 'build'])).rejects.toThrow('exit:1');

    exitSpy.mockRestore();
  });

  it('signals exit 0 when no docs are extracted', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(baseConfig);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(baseConfig);
    globMock.mockResolvedValueOnce(['/tmp/example.ts']);

    (createProgram as jest.Mock).mockReturnValueOnce({
      program: {},
      sourceFiles: [],
      diagnostics: [],
      rootDir: '/tmp',
    });
    (extractDocs as jest.Mock).mockReturnValueOnce([]);

    const program = new Command();
    registerBuild(program);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${String(code ?? '')}`);
    }) as never);

    await expect(program.parseAsync(['node', 'cli', 'build'])).rejects.toThrow('exit:1');

    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });

  it('generates JSON output when format is json', async () => {
    const config = { ...baseConfig, output: { ...baseConfig.output, format: 'json' } };

    (loadConfig as jest.Mock).mockResolvedValueOnce(config);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(config);
    globMock.mockResolvedValueOnce(['/tmp/example.ts']);
    (createProgram as jest.Mock).mockReturnValueOnce({
      program: {},
      sourceFiles: [],
      diagnostics: [],
      rootDir: '/tmp',
    });
    (extractDocs as jest.Mock).mockReturnValueOnce([
      {
        id: 'Example',
        name: 'Example',
        kind: 'function',
        fileName: 'src/example.ts',
        source: { file: 'src/example.ts', line: 1, column: 0 },
        position: { line: 1, column: 0 },
        signature: 'function Example(): void',
      },
    ]);

    const program = new Command();
    registerBuild(program);

    await program.parseAsync(['node', 'cli', 'build']);

    expect(generateJson).toHaveBeenCalled();
  });

  it('generates Markdown output when format is markdown', async () => {
    const config = { ...baseConfig, output: { ...baseConfig.output, format: 'markdown' } };

    (loadConfig as jest.Mock).mockResolvedValueOnce(config);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(config);
    globMock.mockResolvedValueOnce(['/tmp/example.ts']);
    (createProgram as jest.Mock).mockReturnValueOnce({
      program: {},
      sourceFiles: [],
      diagnostics: [],
      rootDir: '/tmp',
    });
    (extractDocs as jest.Mock).mockReturnValueOnce([
      {
        id: 'Example',
        name: 'Example',
        kind: 'function',
        fileName: 'src/example.ts',
        source: { file: 'src/example.ts', line: 1, column: 0 },
        position: { line: 1, column: 0 },
        signature: 'function Example(): void',
      },
    ]);

    const program = new Command();
    registerBuild(program);

    await program.parseAsync(['node', 'cli', 'build']);

    expect(generateMarkdown).toHaveBeenCalled();
  });

  it('uses incremental build when cache is enabled', async () => {
    const config = { ...baseConfig, cache: true };

    (loadConfig as jest.Mock).mockResolvedValueOnce(config);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(config);
    globMock.mockResolvedValueOnce(['/tmp/example.ts']);
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

    const program = new Command();
    registerBuild(program);

    await program.parseAsync(['node', 'cli', 'build']);

    expect(incrementalBuild).toHaveBeenCalled();
  });

  it('prints diagnostics when verbose mode is enabled', async () => {
    const config = { ...baseConfig, verbose: true };

    (loadConfig as jest.Mock).mockResolvedValueOnce(config);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(config);
    globMock.mockResolvedValueOnce(['/tmp/example.ts']);
    (createProgram as jest.Mock).mockReturnValueOnce({
      program: {},
      sourceFiles: [],
      diagnostics: [{ messageText: 'Something went wrong' }],
      rootDir: '/tmp',
    });
    (extractDocs as jest.Mock).mockReturnValueOnce([
      {
        id: 'Example',
        name: 'Example',
        kind: 'function',
        fileName: 'src/example.ts',
        source: { file: 'src/example.ts', line: 1, column: 0 },
        position: { line: 1, column: 0 },
        signature: 'function Example(): void',
      },
    ]);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const program = new Command();
    registerBuild(program);

    await program.parseAsync(['node', 'cli', 'build']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));

    logSpy.mockRestore();
  });

  it('cleans up plugins on failure', async () => {
    const config = { ...baseConfig, output: { ...baseConfig.output, format: 'json' } };

    (loadConfig as jest.Mock).mockResolvedValueOnce(config);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(config);
    globMock.mockResolvedValueOnce(['/tmp/example.ts']);
    (createProgram as jest.Mock).mockReturnValueOnce({
      program: {},
      sourceFiles: [],
      diagnostics: [],
      rootDir: '/tmp',
    });
    (extractDocs as jest.Mock).mockReturnValueOnce([
      {
        id: 'Example',
        name: 'Example',
        kind: 'function',
        fileName: 'src/example.ts',
        source: { file: 'src/example.ts', line: 1, column: 0 },
        position: { line: 1, column: 0 },
        signature: 'function Example(): void',
      },
    ]);

    (generateJson as jest.Mock).mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const program = new Command();
    registerBuild(program);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${String(code ?? '')}`);
    }) as never);

    await expect(program.parseAsync(['node', 'cli', 'build'])).rejects.toThrow('exit:1');

    expect(pluginManagerInstances[0]?.cleanup).toHaveBeenCalled();

    exitSpy.mockRestore();
  });
});
