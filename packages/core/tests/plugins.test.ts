import { PluginManager } from '../src/plugins';
import type { Plugin, Logger } from '../src/plugins';

jest.mock(
  '@opensyntaxhq/autodocs-plugin-default',
  () => ({
    name: 'default-plugin',
    version: '1.0.0',
  }),
  { virtual: true }
);

jest.mock(
  '@opensyntaxhq/autodocs-plugin-factory',
  () => () => ({
    name: 'factory-plugin',
    version: '1.0.0',
  }),
  { virtual: true }
);

jest.mock(
  '@custom/plugin',
  () => ({
    name: 'custom-plugin',
    version: '1.0.0',
  }),
  { virtual: true }
);

describe('PluginManager', () => {
  it('loads plugins, runs hooks in order, and cleans up', async () => {
    const calls: string[] = [];
    const logger: Logger = {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
    };

    const pluginA: Plugin = {
      name: 'plugin-a',
      version: '1.0.0',
      initialize: () => {
        calls.push('init-a');
      },
      beforeParse: (files) => {
        calls.push('before-a');
        return [...files, 'a.ts'];
      },
      cleanup: () => {
        calls.push('cleanup-a');
      },
    };

    const pluginB: Plugin = {
      name: 'plugin-b',
      version: '1.0.0',
      initialize: () => {
        calls.push('init-b');
      },
      beforeParse: (files) => {
        calls.push('before-b');
        return [...files, 'b.ts'];
      },
      cleanup: () => {
        calls.push('cleanup-b');
      },
    };

    const manager = new PluginManager({}, logger);
    await manager.loadPlugin(pluginA);
    await manager.loadPlugin(pluginB);

    const files = await manager.runHook('beforeParse', ['entry.ts']);
    expect(files).toEqual(['entry.ts', 'a.ts', 'b.ts']);
    expect(calls).toEqual(['init-a', 'init-b', 'before-a', 'before-b']);

    await manager.cleanup();
    expect(calls.slice(-2)).toEqual(['cleanup-a', 'cleanup-b']);
  });

  it('continues running hooks when a plugin throws', async () => {
    const errors: string[] = [];
    const logger: Logger = {
      info: () => undefined,
      warn: () => undefined,
      error: (message) => errors.push(message),
      debug: () => undefined,
    };

    const manager = new PluginManager({}, logger);
    await manager.loadPlugin({
      name: 'bad-plugin',
      version: '1.0.0',
      beforeParse: () => {
        throw new Error('boom');
      },
    });
    await manager.loadPlugin({
      name: 'good-plugin',
      version: '1.0.0',
      beforeParse: (files) => [...files, 'ok.ts'],
    });

    const result = await manager.runHook('beforeParse', ['entry.ts']);
    expect(result).toEqual(['entry.ts', 'ok.ts']);
    expect(errors[0]).toContain('bad-plugin');
  });

  it('exposes context cache and events', async () => {
    const payloads: string[] = [];
    const logger: Logger = {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
    };

    const manager = new PluginManager({}, logger);
    await manager.loadPlugin({
      name: 'context-plugin',
      version: '1.0.0',
      initialize: (context) => {
        context.cache.set('answer', 42);
        expect(context.cache.get('answer')).toBe(42);
        context.addHook('test', (data) => {
          payloads.push(String(data));
        });
        context.emitEvent('test', 'ping');
      },
    });

    expect(payloads).toEqual(['ping']);
  });

  it('resolves string plugins from default exports and factories', async () => {
    const info = jest.fn();
    const logger: Logger = {
      info,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
    };

    const manager = new PluginManager({}, logger);
    await manager.loadPlugin('default');
    await manager.loadPlugin('factory');

    expect(info).toHaveBeenCalledWith('Loaded plugin: default-plugin');
    expect(info).toHaveBeenCalledWith('Loaded plugin: factory-plugin');
  });

  it('accepts scoped plugin names without rewriting', async () => {
    const info = jest.fn();
    const logger: Logger = {
      info,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
    };

    const manager = new PluginManager({}, logger);
    await manager.loadPlugin('@custom/plugin');

    expect(info).toHaveBeenCalledWith('Loaded plugin: custom-plugin');
  });

  it('keeps prior hook result when a hook returns undefined', async () => {
    const logger: Logger = {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
    };

    const manager = new PluginManager({}, logger);
    const noopHook: Plugin = {
      name: 'noop-hook',
      version: '1.0.0',
      beforeParse: ((_: string[]) => undefined) as unknown as Plugin['beforeParse'],
    };
    await manager.loadPlugin(noopHook);
    await manager.loadPlugin({
      name: 'append-hook',
      version: '1.0.0',
      beforeParse: (files) => [...files, 'extra.ts'],
    });

    const files = await manager.runHook('beforeParse', ['entry.ts']);
    expect(files).toEqual(['entry.ts', 'extra.ts']);
  });

  it('logs cleanup errors without throwing', async () => {
    const error = jest.fn();
    const logger: Logger = {
      info: () => undefined,
      warn: () => undefined,
      error,
      debug: () => undefined,
    };

    const manager = new PluginManager({}, logger);
    await manager.loadPlugin({
      name: 'cleanup-bomb',
      version: '1.0.0',
      cleanup: () => {
        throw new Error('boom');
      },
    });

    await manager.cleanup();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('cleanup-bomb'));
  });
});
