export * from './types';
export * from './defaults';
export * from './loader';

export function defineConfig(
  config: import('./types').AutodocsConfig
): import('./types').AutodocsConfig {
  return config;
}
