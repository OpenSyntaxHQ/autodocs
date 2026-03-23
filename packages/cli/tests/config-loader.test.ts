import fs from 'fs/promises';
import path from 'path';
import { loadConfig, resolveConfigPaths } from '../src/config/loader';
import { createTempDir } from './helpers/temp';

describe('config loader', () => {
  it('loads JSON config', async () => {
    const tempDir = await createTempDir();
    const configPath = path.join(tempDir, 'autodocs.config.json');
    await fs.writeFile(
      configPath,
      JSON.stringify({ include: ['src/**/*.ts'], output: { dir: './out', format: 'json' } }),
      'utf-8'
    );

    const config = await loadConfig(tempDir);
    expect(config).not.toBeNull();
    expect(config?.output.format).toBe('json');
  });

  it('loads config from package.json', async () => {
    const tempDir = await createTempDir();
    const pkgPath = path.join(tempDir, 'package.json');
    await fs.writeFile(
      pkgPath,
      JSON.stringify({ name: 'test', autodocs: { output: { dir: './docs', format: 'json' } } }),
      'utf-8'
    );

    const config = await loadConfig(tempDir);
    expect(config?.output.dir).toBe('./docs');
  });

  it('loads TypeScript config files', async () => {
    const tempDir = await createTempDir();
    const configPath = path.join(tempDir, 'autodocs.config.ts');
    await fs.writeFile(
      configPath,
      `export default { include: ['src/**/*.ts'], output: { dir: './typed', format: 'json' } };`,
      'utf-8'
    );

    const config = await loadConfig(tempDir);
    expect(config).not.toBeNull();
    expect(config?.output.dir).toBe('./typed');
    expect(config?.output.format).toBe('json');
  });

  it('loads JSON config from an explicit config path', async () => {
    const tempDir = await createTempDir();
    const configPath = path.join(tempDir, 'autodocs.config.json');
    await fs.writeFile(
      configPath,
      JSON.stringify({ include: ['lib/**/*.ts'], output: { dir: './explicit', format: 'json' } }),
      'utf-8'
    );

    const config = await loadConfig(configPath);
    expect(config).not.toBeNull();
    expect(config?.include).toContain('lib/**/*.ts');
    expect(config?.output.dir).toBe('./explicit');
    expect(config?.output.format).toBe('json');
  });

  it('returns null when no config file exists', async () => {
    const tempDir = await createTempDir();
    const config = await loadConfig(tempDir);
    expect(config).toBeNull();
  });

  it('falls back to manual JSON parsing when cosmiconfig returns null for explicit path', async () => {
    const tempDir = await createTempDir();
    const configPath = path.join(tempDir, 'autodocs.config.json');
    await fs.writeFile(
      configPath,
      JSON.stringify({ output: { dir: './fallback-json', format: 'json' } }),
      'utf-8'
    );

    await jest.isolateModulesAsync(async () => {
      jest.doMock('cosmiconfig', () => ({
        cosmiconfig: () => ({
          search: jest.fn(),
          load: jest.fn().mockResolvedValue(null),
        }),
      }));

      const { loadConfig: isolatedLoadConfig } = await import('../src/config/loader');
      const config = await isolatedLoadConfig(configPath);
      expect(config).not.toBeNull();
      expect(config?.output.dir).toBe('./fallback-json');
      expect(config?.output.format).toBe('json');
    });
  });

  it('falls back to jiti for explicit JS config when cosmiconfig returns null for explicit path', async () => {
    const tempDir = await createTempDir();
    const configPath = path.join(tempDir, 'autodocs.config.js');
    await fs.writeFile(
      configPath,
      `module.exports = { output: { dir: './fallback-js', format: 'json' } };`,
      'utf-8'
    );

    await jest.isolateModulesAsync(async () => {
      jest.doMock('cosmiconfig', () => ({
        cosmiconfig: () => ({
          search: jest.fn(),
          load: jest.fn().mockResolvedValue(null),
        }),
      }));

      const { loadConfig: isolatedLoadConfig } = await import('../src/config/loader');
      const config = await isolatedLoadConfig(configPath);
      expect(config).not.toBeNull();
      expect(config?.output.dir).toBe('./fallback-js');
      expect(config?.output.format).toBe('json');
    });
  });

  it('wraps loader errors with a clear message', async () => {
    const tempDir = await createTempDir();

    await jest.isolateModulesAsync(async () => {
      jest.doMock('cosmiconfig', () => ({
        cosmiconfig: () => ({
          search: jest.fn().mockRejectedValue(new Error('broken loader')),
          load: jest.fn(),
        }),
      }));

      const { loadConfig: isolatedLoadConfig } = await import('../src/config/loader');
      await expect(isolatedLoadConfig(tempDir)).rejects.toThrow(
        'Failed to load config: broken loader'
      );
    });
  });

  it('resolves relative paths', async () => {
    const tempDir = await createTempDir();
    const config = resolveConfigPaths(
      {
        include: ['src/**/*.ts'],
        exclude: ['dist'],
        output: { dir: './docs-dist', format: 'json' },
        theme: { name: 'default', logo: './assets/logo.svg' },
      } as import('../src/config').AutodocsConfig,
      tempDir
    );

    expect(config.output.dir).toBe(path.join(tempDir, 'docs-dist'));
    expect(config.include[0]).toBe(path.join(tempDir, 'src/**/*.ts'));
    expect(config.exclude?.[0]).toBe(path.join(tempDir, 'dist'));
    expect(config.theme?.logo).toBe(path.join(tempDir, 'assets/logo.svg'));
  });

  it('keeps absolute and remote asset paths', async () => {
    const tempDir = await createTempDir();
    const config = resolveConfigPaths(
      {
        include: ['src/**/*.ts'],
        output: { dir: './docs-dist', format: 'json' },
        theme: {
          name: 'default',
          logo: 'https://example.com/logo.svg',
          favicon: '/var/tmp/icon.ico',
        },
      } as import('../src/config').AutodocsConfig,
      tempDir
    );

    expect(config.theme?.logo).toBe('https://example.com/logo.svg');
    expect(config.theme?.favicon).toBe('/var/tmp/icon.ico');
  });
});
