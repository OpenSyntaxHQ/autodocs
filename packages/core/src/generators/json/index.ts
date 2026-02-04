import fs from 'fs/promises';
import path from 'path';
import { DocEntry } from '../../extractor';

export interface JsonGeneratorOptions {
  pretty?: boolean;
  splitByModule?: boolean;
  rootDir?: string;
}

export async function generateJson(
  docs: DocEntry[],
  outputDir: string,
  options: JsonGeneratorOptions = {}
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  const normalizedDocs = normalizeDocs(docs, options.rootDir);

  if (options.splitByModule) {
    await generateSplitJson(normalizedDocs, outputDir, options);
  } else {
    await generateSingleJson(normalizedDocs, outputDir, options);
  }

  await generateIndexJson(normalizedDocs, outputDir);
}

async function generateSingleJson(
  docs: DocEntry[],
  outputDir: string,
  options: JsonGeneratorOptions
): Promise<void> {
  const stats = computeStats(docs);
  const output = {
    meta: {
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      rootDir: options.rootDir,
      stats,
    },
    entries: docs,
  };

  const json = JSON.stringify(output, null, options.pretty ? 2 : 0);
  await fs.writeFile(path.join(outputDir, 'docs.json'), json, 'utf-8');
}

async function generateSplitJson(
  docs: DocEntry[],
  outputDir: string,
  options: JsonGeneratorOptions
): Promise<void> {
  const byModule = new Map<string, DocEntry[]>();

  for (const entry of docs) {
    const module = entry.module || getModuleName(entry.fileName);
    if (!byModule.has(module)) {
      byModule.set(module, []);
    }
    byModule.get(module)?.push(entry);
  }

  for (const [module, entries] of byModule) {
    const output = {
      module,
      entries,
    };

    const json = JSON.stringify(output, null, options.pretty ? 2 : 0);
    const fileName = module.replace(/\//g, '_') + '.json';
    await fs.writeFile(path.join(outputDir, fileName), json, 'utf-8');
  }
}

async function generateIndexJson(docs: DocEntry[], outputDir: string): Promise<void> {
  const stats = computeStats(docs);
  const index = {
    total: stats.total,
    byKind: stats.byKind,
    byModule: stats.byModule,
    entries: docs.map((d) => ({
      id: d.id,
      name: d.name,
      kind: d.kind,
      module: d.module || getModuleName(d.fileName),
      source: d.source,
    })),
  };

  await fs.writeFile(path.join(outputDir, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');
}

function normalizeDocs(docs: DocEntry[], rootDir?: string): DocEntry[] {
  return docs.map((doc) => {
    const fileName =
      rootDir && path.isAbsolute(doc.fileName)
        ? toRelativePath(doc.fileName, rootDir)
        : doc.fileName;
    const moduleName = doc.module || getModuleName(fileName);

    return {
      ...doc,
      fileName,
      module: moduleName,
      source: doc.source
        ? {
            ...doc.source,
            file:
              rootDir && path.isAbsolute(doc.source.file)
                ? toRelativePath(doc.source.file, rootDir)
                : doc.source.file,
          }
        : doc.source,
    };
  });
}

function computeStats(docs: DocEntry[]): {
  total: number;
  byKind: Record<string, number>;
  byModule: Record<string, number>;
} {
  const byKind: Record<string, number> = {};
  const byModule: Record<string, number> = {};

  for (const entry of docs) {
    byKind[entry.kind] = (byKind[entry.kind] || 0) + 1;
    const moduleName = entry.module || getModuleName(entry.fileName);
    byModule[moduleName] = (byModule[moduleName] || 0) + 1;
  }

  return {
    total: docs.length,
    byKind,
    byModule,
  };
}

function toRelativePath(fileName: string, rootDir: string): string {
  return path.relative(rootDir, fileName).replace(/\\/g, '/');
}

function getModuleName(fileName: string): string {
  return fileName
    .replace(/\\/g, '/')
    .replace(/\.[^/.]+$/, '')
    .replace(/^.*\/src\//, '');
}
