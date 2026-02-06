import { AutodocsConfig } from './types';

export const DEFAULT_CONFIG: AutodocsConfig = {
  include: ['src/**/*.ts', 'src/**/*.tsx'],
  exclude: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.test.tsx',
    '**/*.spec.tsx',
    '**/node_modules/**',
    '**/*.d.ts',
  ],

  output: {
    dir: './docs-dist',
    format: 'static',
    clean: true,
  },

  theme: {
    name: 'default',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
  },

  features: {
    search: true,
    darkMode: true,
    playground: false,
    examples: true,
    download: true,
    sourceLinks: true,
  },

  cache: true,
  cacheDir: '.autodocs-cache',
  verbose: false,
  ignoreErrors: false,
};
