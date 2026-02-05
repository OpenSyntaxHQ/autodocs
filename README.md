# Autodocs

> Engineer-first documentation generator that turns your TypeScript code into beautiful, interactive docs.

[![CI](https://github.com/OpenSyntaxHQ/autodocs/workflows/CI/badge.svg)](https://github.com/OpenSyntaxHQ/autodocs/actions)
[![codecov](https://codecov.io/gh/OpenSyntaxHQ/autodocs/branch/main/graph/badge.svg)](https://codecov.io/gh/OpenSyntaxHQ/autodocs)
[![npm version](https://badge.fury.io/js/@opensyntaxhq%2Fautodocs.svg)](https://www.npmjs.com/package/@opensyntaxhq/autodocs)
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

## Caching & Watch Mode

Autodocs supports incremental builds with a persistent cache and a watch mode for fast feedback.

```bash
# Clean cache and run a full build
rm -rf .autodocs-cache
npx autodocs build

# Watch for changes and update docs.json without rebuilding UI assets
npx autodocs watch
```

Config options:

```ts
export default defineConfig({
  cache: true,
  cacheDir: '.autodocs-cache',
});
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

## CI/CD

This project ships with a full CI/CD pipeline using GitHub Actions and Netlify:

- Lint, type-check, format, tests with coverage
- Staging deploys from `develop`
- Production deploys from `main`
- PR preview deployments
- CodeQL, dependency review, Trivy, npm audit

If you don’t have a custom domain yet, Netlify will use a default `*.netlify.app` URL.  
When you’re ready, set `SITE_URL` (repo secret or env var) to generate `sitemap.xml` and `robots.txt`.

You can also set it in config:

```ts
export default defineConfig({
  output: {
    siteUrl: 'https://your-domain.example',
  },
});
```

### Build the docs site

```bash
npm run docs:build
```

## Project Structure

- `packages/core` - Core parsing engine
- `packages/cli` - Command-line interface
- `packages/ui` - React documentation UI
- `packages/plugins` - Official plugins

## License

Apache-2.0
