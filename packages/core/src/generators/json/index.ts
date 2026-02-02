import fs from 'fs/promises';
import path from 'path';
import { DocEntry } from '../../extractor';

export interface JsonGeneratorOptions {
  pretty?: boolean;
  splitByModule?: boolean;
}

export async function generateJson(
  docs: DocEntry[],
  outputDir: string,
  options: JsonGeneratorOptions = {}
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  if (options.splitByModule) {
    await generateSplitJson(docs, outputDir, options);
  } else {
    await generateSingleJson(docs, outputDir, options);
  }

  // Generate index
  await generateIndexJson(docs, outputDir);
}

async function generateSingleJson(
  docs: DocEntry[],
  outputDir: string,
  options: JsonGeneratorOptions
): Promise<void> {
  const output = {
    version: '0.1.0',
    generatedAt: new Date().toISOString(),
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
  // Group by module
  const byModule = new Map<string, DocEntry[]>();

  for (const entry of docs) {
    const module = getModuleName(entry.fileName);
    if (!byModule.has(module)) {
      byModule.set(module, []);
    }
    const list = byModule.get(module);
    if (list) {
      list.push(entry);
    }
  }

  // Generate file per module
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
  const index = {
    total: docs.length,
    byKind: {} as Record<string, number>,
    byModule: {} as Record<string, number>,
    entries: docs.map((d) => ({
      id: d.id,
      name: d.name,
      kind: d.kind,
      module: getModuleName(d.fileName),
    })),
  };

  // Count by kind
  docs.forEach((d) => {
    index.byKind[d.kind] = (index.byKind[d.kind] || 0) + 1;
  });

  // Count by module
  docs.forEach((d) => {
    const module = getModuleName(d.fileName);
    index.byModule[module] = (index.byModule[module] || 0) + 1;
  });

  await fs.writeFile(path.join(outputDir, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');
}

function getModuleName(fileName: string): string {
  return fileName
    .replace(/\\/g, '/')
    .replace(/\.[^/.]+$/, '')
    .replace(/^.*\/src\//, '');
}
