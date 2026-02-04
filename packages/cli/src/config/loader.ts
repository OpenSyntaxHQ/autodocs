import { cosmiconfig } from 'cosmiconfig';
import path from 'path';
import jiti from 'jiti';
import { AutodocsConfig } from './types';
import { DEFAULT_CONFIG } from './defaults';

// Setup jiti for loading TS files
const jitiLoader = jiti(__filename);

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
      '.ts': (filepath: string) => jitiLoader(filepath) as unknown,
    },
  });

  try {
    const result = await explorer.search(searchFrom);

    if (!result || result.isEmpty) {
      return null;
    }

    // Handle "export default" from TS/ESM files
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const config = result.config.default || result.config;

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
    theme: config.theme
      ? {
          ...config.theme,
          logo: resolveAssetPath(config.theme.logo),
          favicon: resolveAssetPath(config.theme.favicon),
        }
      : config.theme,
  };
}
