# @opensyntaxhq/autodocs-plugin-examples

Code example validation and extraction plugin for Autodocs.

## Install

```bash
npm install -D @opensyntaxhq/autodocs-plugin-examples
```

## Usage

```ts
import { defineConfig } from '@opensyntaxhq/autodocs';

export default defineConfig({
  plugins: [
    {
      name: '@opensyntaxhq/autodocs-plugin-examples',
      options: {
        validate: true,
        outputDir: 'examples',
      },
    },
  ],
});
```

## Options

- `validate` (boolean, optional): type-check examples (default `false`).
- `outputDir` (string, optional): directory (relative to output) for extracted examples.

## Output

When `outputDir` is set, the plugin writes `examples.json` plus individual example files.
