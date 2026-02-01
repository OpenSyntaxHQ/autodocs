# Autodocs

> Engineer-first documentation generator that turns your TypeScript code into beautiful, interactive docs.

[![CI](https://github.com/OpenSyntaxHQ/autodocs/workflows/CI/badge.svg)](https://github.com/OpenSyntaxHQ/autodocs/actions)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Features

- 🎯 **Type-Driven**: Auto-generates docs from TypeScript types
- 🚀 **Zero Config**: Works out of the box
- ⚡ **Fast**: Incremental builds with caching
- 🎨 **Beautiful UI**: Modern, interactive documentation
- 🔌 **Extensible**: Powerful plugin system

## Quick Start

```bash
npm install -D @opensyntaxhq/autodocs
npx autodocs init
npx autodocs build
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode
npm run dev

# Run tests
npm run test

# Lint code
npm run lint
```

## Project Structure

- `packages/core` - Core parsing engine
- `packages/cli` - Command-line interface
- `packages/ui` - React documentation UI
- `packages/plugins` - Official plugins

## License

Apache-2.0
