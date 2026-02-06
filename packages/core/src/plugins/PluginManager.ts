import { Plugin, PluginContext, Logger } from './types';

export class PluginManager {
  private plugins: Plugin[] = [];
  private context: PluginContext;

  constructor(config: unknown, logger?: Logger) {
    this.context = this.createContext(config, logger);
  }

  async loadPlugin(plugin: Plugin | string): Promise<void> {
    const pluginInstance = typeof plugin === 'string' ? await this.resolvePlugin(plugin) : plugin;

    this.plugins.push(pluginInstance);

    if (pluginInstance.initialize) {
      await pluginInstance.initialize(this.context);
    }

    this.context.logger.info(`Loaded plugin: ${pluginInstance.name}`);
  }

  async runHook<T>(hookName: keyof Plugin, value: T): Promise<T> {
    let result = value;

    for (const plugin of this.plugins) {
      const hook = plugin[hookName] as ((value: T) => unknown) | undefined;
      if (typeof hook !== 'function') {
        continue;
      }

      try {
        const hookResult = await hook(result);
        if (hookResult !== undefined) {
          result = hookResult as T;
        }
      } catch (error) {
        this.context.logger.error(
          `Error in plugin ${plugin.name} hook ${hookName}: ${String(error)}`
        );
      }
    }

    return result;
  }

  async cleanup(): Promise<void> {
    for (const plugin of this.plugins) {
      if (!plugin.cleanup) {
        continue;
      }

      try {
        await plugin.cleanup();
      } catch (error) {
        this.context.logger.error(`Error cleaning up plugin ${plugin.name}: ${String(error)}`);
      }
    }
  }

  private async resolvePlugin(name: string): Promise<Plugin> {
    const packageName = name.startsWith('@') ? name : `@opensyntaxhq/autodocs-plugin-${name}`;

    try {
      const module = (await import(packageName)) as unknown;
      const exported = this.getModuleExport(module);
      return this.resolvePluginExport(exported);
    } catch (error) {
      throw new Error(`Failed to load plugin ${packageName}: ${String(error)}`);
    }
  }

  private resolvePluginExport(exported: unknown): Plugin {
    if (typeof exported === 'function') {
      const factory = exported as () => Plugin;
      return factory();
    }

    return exported as Plugin;
  }

  private getModuleExport(module: unknown): unknown {
    if (module && typeof module === 'object' && 'default' in module) {
      const mod = module as { default?: unknown };
      return mod.default ?? module;
    }

    return module;
  }

  private createContext(config: unknown, logger?: Logger): PluginContext {
    const cache = new Map<string, unknown>();
    const eventHandlers = new Map<string, Array<(data: unknown) => void>>();

    const defaultLogger: Logger = {
      info: (msg) => {
        console.log(`[INFO] ${msg}`);
      },
      warn: (msg) => {
        console.warn(`[WARN] ${msg}`);
      },
      error: (msg) => {
        console.error(`[ERROR] ${msg}`);
      },
      debug: (msg) => {
        console.debug(`[DEBUG] ${msg}`);
      },
    };

    return {
      config,
      logger: logger ?? defaultLogger,
      cache,
      emitEvent: (name, data) => {
        const handlers = eventHandlers.get(name) || [];
        handlers.forEach((handler) => {
          handler(data);
        });
      },
      addHook: (name, handler) => {
        if (!eventHandlers.has(name)) {
          eventHandlers.set(name, []);
        }
        eventHandlers.get(name)?.push(handler);
      },
    };
  }
}
