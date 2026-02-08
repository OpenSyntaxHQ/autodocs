# @opensyntaxhq/autodocs-core

Core parsing, extraction, and generation engine for Autodocs.

## Install

```bash
npm install @opensyntaxhq/autodocs-core
```

## Usage

```ts
import path from 'path';
import { createProgram, extractDocs, generateJson } from '@opensyntaxhq/autodocs-core';

const entryFile = path.join(process.cwd(), 'src/index.ts');
const { program, rootDir } = createProgram([entryFile]);
const docs = extractDocs(program, { rootDir });

await generateJson(docs, path.join(process.cwd(), 'docs-dist'), {
  pretty: true,
  rootDir,
});
```

## API Surface

- `createProgram` / `extractDocs`
- `generateJson`, `generateMarkdown`, `generateHtml`
- `PluginManager`
- `FileCache` and `incrementalBuild`
