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

  it('resolves relative paths', async () => {
    const tempDir = await createTempDir();
    const config = resolveConfigPaths(
      {
        include: ['src/**/*.ts'],
        output: { dir: './docs-dist', format: 'json' },
        theme: { name: 'default', logo: './assets/logo.svg' },
      } as import('../src/config').AutodocsConfig,
      tempDir
    );

    expect(config.output.dir).toBe(path.join(tempDir, 'docs-dist'));
    expect(config.include[0]).toBe(path.join(tempDir, 'src/**/*.ts'));
    expect(config.theme?.logo).toBe(path.join(tempDir, 'assets/logo.svg'));
  });
});
