# Plugin Development Guide

## Creating a Plugin

```typescript
import { Plugin } from '@opensyntaxhq/autodocs-core';

export default function myPlugin(options: any): Plugin {
  return {
    name: 'my-plugin',
    version: '1.0.0',

    async initialize(context) {
      context.logger.info('Plugin initialized');
    },

    async afterExtract(docs) {
      // Modify or add documentation entries
      return docs;
    },
  };
}
```

## Available Hooks

- `initialize` - Called when plugin loads
- `beforeParse` - Before TypeScript parsing
- `afterParse` - After TypeScript parsing
- `beforeExtract` - Before documentation extraction
- `afterExtract` - After documentation extraction
- `beforeGenerate` - Before output generation
- `afterGenerate` - After output generation
- `cleanup` - Plugin cleanup

## Plugin Context

```typescript
interface PluginContext {
  config: any; // User configuration
  logger: Logger; // Logging utilities
  cache: Map<string, any>; // Plugin cache
  emitEvent(name: string, data: any): void;
  addHook(name: string, handler: Function): void;
}
```

## Example: Custom Generator Plugin Template

This is a template showing how users can create their own plugins. This is NOT part of the core implementation - it's documentation for plugin developers.

```typescript
export default function customGeneratorPlugin(options: { format: string }): Plugin {
  return {
    name: 'custom-generator',
    version: '1.0.0',

    async afterGenerate(outputDir) {
      // Generate custom output format
      if (options.format === 'custom') {
        // User would implement their custom format here
        // Example: generate XML, AsciiDoc, etc.
        const fs = await import('fs/promises');
        await fs.writeFile(`${outputDir}/custom.txt`, 'Custom format output', 'utf-8');
      }
    },
  };
}
```
