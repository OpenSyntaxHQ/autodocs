import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import markdownPlugin from '../../plugins/markdown/src/index';
import type { PluginContext } from '../src/plugins';

describe('Markdown plugin', () => {
  it('parses front matter and creates guide entries', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autodocs-md-'));
    const filePath = path.join(tempDir, 'guide.md');

    await fs.writeFile(
      filePath,
      `---
title: Getting Started
description: Intro guide
---

# Hello

Some content.`,
      'utf-8'
    );

    const plugin = markdownPlugin({ sourceDir: tempDir });
    const cache = new Map<string, unknown>();

    const context: PluginContext = {
      config: {},
      logger: {
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        debug: () => undefined,
      },
      cache,
      emitEvent: () => undefined,
      addHook: () => undefined,
    };

    await plugin.initialize?.(context);

    const docs = (await plugin.afterExtract?.([])) || [];
    expect(docs).toHaveLength(1);

    const guide = docs[0];
    expect(guide.kind).toBe('guide');
    expect(guide.name).toBe('Getting Started');
    expect(guide.documentation?.summary).toBe('Intro guide');
    const metadata = guide.metadata as { markdown?: string; html?: string };
    expect(metadata.markdown).toContain('Some content');
    expect(metadata.html).toContain('<h1');
  });
});
