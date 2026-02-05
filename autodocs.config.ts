import { defineConfig } from '@opensyntaxhq/autodocs';

export default defineConfig({
  include: ['packages/**/*.ts', 'packages/**/*.tsx'],
  exclude: ['**/*.test.ts', '**/*.spec.ts'],
  output: {
    dir: './docs-dist',
    format: 'static',
    clean: true,
  },
  theme: {
    name: 'default',
    primaryColor: '#6366f1',
  },
  features: {
    search: true,
    darkMode: true,
    examples: true,
  },
  sidebar: [
    { title: 'Getting Started', path: '/docs/intro.md' },
    { title: 'API Reference', autogenerate: 'src/' },
    { title: 'Types', autogenerate: 'src/types/' },
  ],
  plugins: [
    {
      name: '@opensyntaxhq/autodocs-plugin-markdown',
      options: {
        sourceDir: 'docs',
        patterns: ['**/*.md'],
        frontMatter: true,
      },
    },
    {
      name: '@opensyntaxhq/autodocs-plugin-examples',
      options: {
        validate: true,
        outputDir: './examples',
      },
    },
  ],
});
