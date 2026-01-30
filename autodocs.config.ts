// @ts-nocheck
// This is an example configuration file. 
// Once the packages are linked, the import will work.

import { defineConfig } from '@opensyntaxhq/autodocs';

export default defineConfig({
  // Entry points to document
  include: ['src/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.spec.ts'],
  
  // Output settings
  output: {
    dir: './docs-dist',
    format: 'static', // or 'json' for custom UI
  },
  
  // UI customization
  theme: {
    name: 'default', // or 'minimal', 'corporate'
    primaryColor: '#6366f1',
    logo: './assets/logo.svg',
  },
  
  // Documentation structure
  sidebar: [
    { title: 'Getting Started', path: '/docs/intro.md' },
    { title: 'API Reference', autogenerate: 'src/api/' },
    { title: 'Types', autogenerate: 'src/types/' },
  ],
  
  // Plugins
  plugins: [
    '@opensyntaxhq/autodocs-plugin-markdown',
    '@opensyntaxhq/autodocs-plugin-examples',
  ],
});
