# @opensyntaxhq/autodocs-core

The core parsing and generation engine for autodocs.

## Exports

- `parseTypescript(entryFile: string)`: Parses specific file and its dependencies
- `extractDocs(program: ts.Program)`: Extracts documentation from the AST
- `generateDocs(docs: DocEntry[])`: Generates the output format
