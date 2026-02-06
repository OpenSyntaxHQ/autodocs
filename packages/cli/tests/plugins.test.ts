import fs from 'fs/promises';
import path from 'path';
import { PluginManager } from '@opensyntaxhq/autodocs-core';
import { loadPlugins } from '../src/commands/build';
import { createTempDir } from './helpers/temp';

describe('CLI plugin loading', () => {
  it('loads plugins from local paths with options', async () => {
    const tempDir = await createTempDir('autodocs-cli-');
    const pluginPath = path.join(tempDir, 'plugin.cjs');

    await fs.writeFile(
      pluginPath,
      `
        module.exports = function(options) {
          return {
            name: 'local-plugin',
            version: '1.0.0',
            initialize() {
              globalThis.__pluginOptions = options;
            },
          };
        };
      `,
      'utf-8'
    );

    const manager = new PluginManager(
      {},
      {
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        debug: () => undefined,
      }
    );
    await loadPlugins(manager, [{ name: './plugin.cjs', options: { enabled: true } }], tempDir);

    expect((globalThis as Record<string, unknown>).__pluginOptions).toEqual({ enabled: true });
  });

  it('loads plugins from local paths without options', async () => {
    const tempDir = await createTempDir('autodocs-cli-');
    const pluginPath = path.join(tempDir, 'plugin.cjs');

    await fs.writeFile(
      pluginPath,
      `
        module.exports = function(options) {
          return {
            name: 'local-plugin',
            version: '1.0.0',
            initialize() {
              globalThis.__pluginOptions = options ?? null;
            },
          };
        };
      `,
      'utf-8'
    );

    const manager = new PluginManager(
      {},
      {
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        debug: () => undefined,
      }
    );
    await loadPlugins(manager, ['./plugin.cjs'], tempDir);

    expect((globalThis as Record<string, unknown>).__pluginOptions).toBeNull();
  });
});
