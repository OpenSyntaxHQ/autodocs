# @opensyntaxhq/autodocs-plugin-markdown

Markdown guide plugin for Autodocs. It ingests `.md` files and exposes them as `guide` entries in `docs.json`.

## Install

```bash
npm install -D @opensyntaxhq/autodocs-plugin-markdown
```

## Usage

```ts
import { defineConfig } from '@opensyntaxhq/autodocs';

export default defineConfig({
  plugins: [
    {
      name: '@opensyntaxhq/autodocs-plugin-markdown',
      options: {
        sourceDir: 'docs',
        patterns: ['**/*.md'],
        frontMatter: true,
      },
    },
  ],
});
```

## Options

- `sourceDir` (string, required): directory to scan for markdown files.
- `patterns` (string[], optional): glob patterns (default `['**/*.md']`).
- `frontMatter` (boolean, optional): parse front matter (default `true`).

## Output

Each markdown file becomes a `guide` entry with rendered HTML and raw markdown stored in `metadata`.
