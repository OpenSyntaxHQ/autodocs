import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { glob } from 'glob';
import { Plugin, PluginContext, DocEntry } from '@opensyntaxhq/autodocs-core';

export interface MarkdownPluginOptions {
  sourceDir: string;
  patterns?: string[];
  frontMatter?: boolean;
}

interface MarkdownFile {
  path: string;
  frontMatter: Record<string, unknown>;
  markdown: string;
  html: string;
}

export default function markdownPlugin(options: MarkdownPluginOptions): Plugin {
  const files: MarkdownFile[] = [];

  return {
    name: '@opensyntaxhq/autodocs-plugin-markdown',
    version: '0.1.0',

    async initialize(context: PluginContext) {
      context.logger.info('Initializing markdown plugin');

      const patterns = options.patterns || ['**/*.md'];
      const foundFiles = await glob(patterns, {
        cwd: options.sourceDir,
        absolute: true,
        nodir: true,
      });

      for (const file of foundFiles) {
        const content = await fs.readFile(file, 'utf-8');
        let frontMatter: Record<string, unknown> = {};
        let markdown = content;

        if (options.frontMatter !== false) {
          const parsed = matter(content);
          frontMatter = parsed.data as Record<string, unknown>;
          markdown = parsed.content;
        }

        const rendered = marked.parse(markdown);
        const html = typeof rendered === 'string' ? rendered : await rendered;

        files.push({
          path: file,
          frontMatter,
          markdown,
          html,
        });
      }

      context.logger.info(`Found ${files.length.toString()} markdown files`);
      context.cache.set('markdown:files', files);
    },

    afterExtract(docs: DocEntry[]) {
      const guideDocs: DocEntry[] = files.map((file) => {
        const fileName = path.basename(file.path, path.extname(file.path));
        const title =
          typeof file.frontMatter.title === 'string' ? file.frontMatter.title : fileName;
        const description =
          typeof file.frontMatter.description === 'string' ? file.frontMatter.description : '';

        return {
          id: `guide:${file.path}`,
          name: title,
          kind: 'guide',
          fileName: file.path,
          source: { file: file.path, line: 1, column: 0 },
          position: { line: 1, column: 0 },
          signature: '',
          documentation: {
            summary: description,
            tags: [],
          },
          metadata: {
            markdown: file.markdown,
            html: file.html,
            frontMatter: file.frontMatter,
          },
        };
      });

      return [...docs, ...guideDocs];
    },
  };
}

export { markdownPlugin };
