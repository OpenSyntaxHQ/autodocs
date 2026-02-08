# @opensyntaxhq/autodocs

Engineer-first documentation generator for TypeScript.

## Install

```bash
npm install -D @opensyntaxhq/autodocs
```

## Quick start

```bash
npx autodocs init
npx autodocs build
npx autodocs serve
```

## Commands

- `autodocs init` - create `autodocs.config.*`
- `autodocs build` - generate docs and UI in `docs-dist`
- `autodocs watch` - incremental rebuilds with cache
- `autodocs serve` - serve the generated site
- `autodocs check` - validate configuration and inputs

## Config

```ts
import { defineConfig } from '@opensyntaxhq/autodocs';

export default defineConfig({
  input: 'src',
  output: 'docs-dist',
  plugins: [
    { name: '@opensyntaxhq/autodocs-plugin-markdown', options: { sourceDir: 'docs' } },
    {
      name: '@opensyntaxhq/autodocs-plugin-examples',
      options: { validate: true, outputDir: 'examples' },
    },
  ],
});
```

## Notes

Set `SITE_URL` (env or config) to generate `sitemap.xml` and `robots.txt`.
