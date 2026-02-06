import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import ts from 'typescript';
import { Plugin, DocEntry, CodeExample, VERSION } from '@opensyntaxhq/autodocs-core';

export interface ExamplesPluginOptions {
  validate?: boolean;
  outputDir?: string;
}

interface ExampleRecord {
  entryId: string;
  entryName: string;
  index: number;
  language: string;
  code: string;
  filePath?: string;
}

export default function examplesPlugin(options: ExamplesPluginOptions = {}): Plugin {
  const records: ExampleRecord[] = [];

  return {
    name: '@opensyntaxhq/autodocs-plugin-examples',
    version: VERSION,

    async afterExtract(docs: DocEntry[]) {
      for (const entry of docs) {
        const examples = entry.documentation?.examples;
        if (!examples || examples.length === 0) {
          continue;
        }

        for (const [index, example] of examples.entries()) {
          if (options.validate) {
            await validateExample(example, entry);
          }

          records.push({
            entryId: entry.id,
            entryName: entry.name,
            index,
            language: example.language,
            code: example.code,
          });
        }
      }

      return docs;
    },

    async afterGenerate(outputDir: string) {
      if (!options.outputDir || records.length === 0) {
        return;
      }

      const examplesDir = path.isAbsolute(options.outputDir)
        ? options.outputDir
        : path.join(outputDir, options.outputDir);

      await fs.mkdir(examplesDir, { recursive: true });

      for (const record of records) {
        const exampleNumber = record.index + 1;
        const baseName = `${slugify(record.entryName)}__example-${exampleNumber.toString()}`;
        const extension = languageToExtension(record.language);
        const fileName = `${baseName}.${extension}`;
        const filePath = path.join(examplesDir, fileName);

        await fs.writeFile(filePath, record.code, 'utf-8');
        record.filePath = fileName;
      }

      const indexPayload = records.map((record) => ({
        entryId: record.entryId,
        entryName: record.entryName,
        index: record.index,
        language: record.language,
        file: record.filePath,
      }));

      await fs.writeFile(
        path.join(examplesDir, 'examples.json'),
        JSON.stringify(indexPayload, null, 2),
        'utf-8'
      );
    },
  };
}

async function validateExample(example: CodeExample, entry: DocEntry): Promise<void> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autodocs-example-'));
  const extension = languageToExtension(example.language);
  const tempFile = path.join(tempDir, `example.${extension}`);

  try {
    const normalized = example.code.endsWith('\n') ? example.code : `${example.code}\n`;
    const stub = buildEntryStub(entry, normalized);
    const wrapped = `${stub}${normalized}export {};\n`;
    await fs.writeFile(tempFile, wrapped, 'utf-8');

    const program = ts.createProgram([tempFile], {
      noEmit: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
    });

    const diagnostics = ts.getPreEmitDiagnostics(program);

    if (diagnostics.length > 0) {
      const errors = diagnostics.map((d) => {
        const message =
          typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
        return message;
      });

      throw new Error(`TypeScript errors:\n${errors.join('\n')}`);
    }
  } finally {
    try {
      await fs.unlink(tempFile);
      await fs.rmdir(tempDir);
    } catch {
      // ignore cleanup errors
    }
  }
}

function buildEntryStub(entry: DocEntry, code: string): string {
  const name = entry.name;
  if (!isValidIdentifier(name)) {
    return '';
  }

  const escaped = escapeRegExp(name);
  const usagePattern = new RegExp(`\\b${escaped}\\b`);
  if (!usagePattern.test(code)) {
    return '';
  }

  if (hasDeclaration(code, escaped)) {
    return '';
  }

  switch (entry.kind) {
    case 'class':
      return `declare class ${name} {}\n`;
    case 'enum':
      return `declare enum ${name} {}\n`;
    case 'interface':
      return `interface ${name} {}\n`;
    case 'type':
      return `type ${name} = any;\n`;
    case 'function':
      return `declare function ${name}(...args: any[]): any;\n`;
    case 'variable':
      return `declare const ${name}: any;\n`;
    default:
      return `declare const ${name}: any;\n`;
  }
}

function hasDeclaration(code: string, escapedName: string): boolean {
  const patterns = [
    `\\bimport\\s+[^;]*\\b${escapedName}\\b`,
    `\\bimport\\s+\\{[^}]*\\b${escapedName}\\b[^}]*\\}\\s+from`,
    `\\bimport\\s+${escapedName}\\s+from`,
    `\\bfunction\\s+${escapedName}\\b`,
    `\\bclass\\s+${escapedName}\\b`,
    `\\binterface\\s+${escapedName}\\b`,
    `\\btype\\s+${escapedName}\\b`,
    `\\bconst\\s+${escapedName}\\b`,
    `\\blet\\s+${escapedName}\\b`,
    `\\bvar\\s+${escapedName}\\b`,
    `\\benum\\s+${escapedName}\\b`,
    `\\bexport\\s+(?:default\\s+)?(?:function|class|const|let|var|enum|interface|type)\\s+${escapedName}\\b`,
  ];

  return patterns.some((pattern) => new RegExp(pattern).test(code));
}

function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function languageToExtension(language: string): string {
  const normalized = language.toLowerCase();
  if (normalized === 'tsx') return 'tsx';
  if (normalized === 'javascript' || normalized === 'js') return 'js';
  if (normalized === 'typescript' || normalized === 'ts') return 'ts';
  return 'txt';
}

export { examplesPlugin };
