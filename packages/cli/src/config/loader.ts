import { cosmiconfig } from 'cosmiconfig';
import fs from 'fs';
import path from 'path';
import { createJiti } from 'jiti';
import { AutodocsConfig } from './types';
import { DEFAULT_CONFIG } from './defaults';

// Setup jiti for loading TS files
const jiti = createJiti(__filename);

export async function loadConfig(searchFrom?: string): Promise<AutodocsConfig | null> {
  const explorer = cosmiconfig('autodocs', {
    searchPlaces: [
      'autodocs.config.ts',
      'autodocs.config.js',
      'autodocs.config.mjs',
      'autodocs.config.cjs',
      'autodocs.config.json',
      'package.json',
    ],
    loaders: {
      '.ts': (filepath: string) => jiti.import(filepath, { default: true }),
    },
  });

  try {
    const resolvedPath = searchFrom ? path.resolve(searchFrom) : undefined;
    const hasExplicitConfig =
      resolvedPath && path.extname(resolvedPath) && fs.existsSync(resolvedPath);
    const result = hasExplicitConfig
      ? await explorer.load(resolvedPath)
      : await explorer.search(searchFrom);

    if (!result || result.isEmpty) {
      if (hasExplicitConfig && resolvedPath) {
        const ext = path.extname(resolvedPath);
        if (ext === '.json') {
          const raw = await fs.promises.readFile(resolvedPath, 'utf-8');
          return mergeConfig(DEFAULT_CONFIG, JSON.parse(raw) as Partial<AutodocsConfig>);
        }
        if (['.ts', '.js', '.mjs', '.cjs'].includes(ext)) {
          const loaded = await jiti.import(resolvedPath, { default: true });
          const config = (loaded as { default?: unknown }).default || loaded;
          return mergeConfig(DEFAULT_CONFIG, config as Partial<AutodocsConfig>);
        }
      }
      return null;
    }

    // Handle "export default" from TS/ESM files
    const rawConfig = result.config as unknown;
    const hasDefaultExport =
      typeof rawConfig === 'object' && rawConfig !== null && 'default' in rawConfig;
    const config = hasDefaultExport
      ? ((rawConfig as { default?: unknown }).default ?? rawConfig)
      : rawConfig;

    return mergeConfig(DEFAULT_CONFIG, config as Partial<AutodocsConfig>);
  } catch (error) {
    throw new Error(`Failed to load config: ${(error as Error).message}`);
  }
}

export function mergeConfig(
  base: AutodocsConfig,
  override: Partial<AutodocsConfig>
): AutodocsConfig {
  return {
    ...base,
    ...override,
    output: {
      ...base.output,
      ...override.output,
    },
    theme: {
      ...base.theme,
      ...(override.theme || {}),
    } as import('./types').ThemeConfig,
    features: {
      ...base.features,
      ...override.features,
    },
  };
}

export function resolveConfigPaths(config: AutodocsConfig, configDir: string): AutodocsConfig {
  const resolveAssetPath = (value?: string): string | undefined => {
    if (!value) {
      return value;
    }
    if (/^(https?:|data:)/.test(value) || value.startsWith('/')) {
      return value;
    }
    return path.resolve(configDir, value);
  };

  return {
    ...config,
    include: config.include.map((p) => path.resolve(configDir, p)),
    exclude: config.exclude?.map((p) => path.resolve(configDir, p)),
    output: {
      ...config.output,
      dir: path.resolve(configDir, config.output.dir),
    },
    tsconfig: config.tsconfig ? path.resolve(configDir, config.tsconfig) : undefined,
    cacheDir: config.cacheDir ? path.resolve(configDir, config.cacheDir) : config.cacheDir,
    theme: config.theme
      ? {
          ...config.theme,
          logo: resolveAssetPath(config.theme.logo),
          favicon: resolveAssetPath(config.theme.favicon),
        }
      : config.theme,
  };
}
