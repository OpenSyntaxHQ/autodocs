# @opensyntaxhq/autodocs

Engineer-first documentation generator for TypeScript.

## Install

```bash
npm install -D @opensyntaxhq/autodocs
```

Run via local binary:

```bash
npx autodocs build
# or
npm exec autodocs build
```

If you want `autodocs` available globally in your shell:

```bash
npm install -g @opensyntaxhq/autodocs
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

From `2.0.1+`, the React UI assets are bundled with the CLI package, so `autodocs build` static output does not require installing a separate UI package.
