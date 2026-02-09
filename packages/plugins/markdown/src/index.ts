import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import { marked } from 'marked';
import { glob } from 'glob';
import { Plugin, PluginContext, DocEntry, VERSION } from '@opensyntaxhq/autodocs-core';

export interface MarkdownPluginOptions {
  sourceDir: string;
  patterns?: string[];
  frontMatter?: boolean;
}

interface MarkdownFile {
  path: string;
  relativePath: string;
  frontMatter: Record<string, unknown>;
  markdown: string;
  html: string;
}

function normalizePath(input: string): string {
  return input.replace(/\\/g, '/');
}

function generateGuideId(relativePath: string): string {
  const content = `guide|${normalizePath(relativePath)}`;
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

export default function markdownPlugin(options: MarkdownPluginOptions): Plugin {
  const files: MarkdownFile[] = [];

  return {
    name: '@opensyntaxhq/autodocs-plugin-markdown',
    version: VERSION,

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
        const relativePath = normalizePath(path.relative(options.sourceDir, file));
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
          relativePath,
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
        const modulePath = file.relativePath.replace(/\.[^/.]+$/, '');
        const title =
          typeof file.frontMatter.title === 'string' ? file.frontMatter.title : fileName;
        const description =
          typeof file.frontMatter.description === 'string' ? file.frontMatter.description : '';

        return {
          id: generateGuideId(file.relativePath),
          name: title,
          kind: 'guide',
          fileName: file.relativePath,
          module: modulePath,
          source: { file: file.relativePath, line: 1, column: 0 },
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
