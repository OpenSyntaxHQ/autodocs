import { PluginManager } from '../src/plugins';
import type { Plugin, PluginContext, Logger } from '../src/plugins';

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
      initialize: () => calls.push('init-a'),
      beforeParse: (files) => {
        calls.push('before-a');
        return [...files, 'a.ts'];
      },
      cleanup: () => calls.push('cleanup-a'),
    };

    const pluginB: Plugin = {
      name: 'plugin-b',
      version: '1.0.0',
      initialize: () => calls.push('init-b'),
      beforeParse: (files) => {
        calls.push('before-b');
        return [...files, 'b.ts'];
      },
      cleanup: () => calls.push('cleanup-b'),
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
    let capturedContext: PluginContext | null = null;
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
        capturedContext = context;
        context.cache.set('answer', 42);
      },
    });

    const context = capturedContext as {
      cache: Map<string, unknown>;
      addHook: (name: string, handler: (data: unknown) => void) => void;
      emitEvent: (name: string, data: unknown) => void;
    };

    expect(context.cache.get('answer')).toBe(42);

    const payloads: string[] = [];
    context.addHook('test', (data) => {
      payloads.push(String(data));
    });
    context.emitEvent('test', 'ping');
    expect(payloads).toEqual(['ping']);
  });
});
