# Autodocs

> Engineer-first documentation generator that turns your TypeScript code into beautiful, interactive docs.

![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

**Autodocs** automatically generates documentation from your TypeScript types, interfaces, JSDoc comments, and function signatures. The output is an interactive web UI with features like type exploration, search, and copy-paste examples.

## Features

- **Type-Driven**: Auto-generates docs from your code.
- **Interactive UI**: Explore types and functions in a beautiful React app.
- **Zero Config**: Works out of the box for most projects.
- **Extensible**: Plugin system for Markdown, OpenAPI, etc.

## Installation

```bash
npm install -D @opensyntaxhq/autodocs
```

## Usage

Initialize the configuration:

```bash
npx autodocs init
```

Build the documentation:

```bash
npx autodocs build
```

Serve locally:

```bash
npx autodocs serve
```

## Structure

- `packages/core`: Core parsing engine.
- `packages/cli`: Command-line interface.
- `packages/ui`: React documentation UI.
- `packages/plugins`: Official plugins.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

Apache-2.0
