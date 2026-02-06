import { PluginManager } from '../src/plugins/PluginManager';
import type { Plugin } from '../src/plugins/types';

describe('PluginManager Advanced', () => {
  it('executes hooks in order and passes values', async () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const pluginA: Plugin = {
      name: 'plugin-a',
      version: '1.0.0',
      beforeParse: (files) => [...files, 'b.ts'],
    };

    const pluginB: Plugin = {
      name: 'plugin-b',
      version: '1.0.0',
      beforeParse: (files) => files.filter((f) => f !== 'a.ts'),
    };

    const manager = new PluginManager({}, logger);
    await manager.loadPlugin(pluginA);
    await manager.loadPlugin(pluginB);

    const result = await manager.runHook('beforeParse', ['a.ts']);
    expect(result).toEqual(['b.ts']);
  });

  it('continues after hook errors', async () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const pluginA: Plugin = {
      name: 'plugin-a',
      version: '1.0.0',
      afterExtract: () => {
        throw new Error('boom');
      },
    };

    const pluginB: Plugin = {
      name: 'plugin-b',
      version: '1.0.0',
      afterExtract: (docs) => [...docs, { id: 'extra' } as never],
    };

    const manager = new PluginManager({}, logger);
    await manager.loadPlugin(pluginA);
    await manager.loadPlugin(pluginB);

    const result = await manager.runHook('afterExtract', [] as never[]);
    expect(result).toHaveLength(1);
    expect(logger.error).toHaveBeenCalled();
  });

  it('throws for missing plugin module', async () => {
    const manager = new PluginManager({});
    await expect(manager.loadPlugin('@opensyntaxhq/autodocs-plugin-missing')).rejects.toThrow(
      'Failed to load plugin'
    );
  });
});
