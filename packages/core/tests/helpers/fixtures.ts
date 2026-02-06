import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import ts from 'typescript';
import type { DocEntry } from '../../src/extractor';

const trackedTempDirs = new Set<string>();

export async function createTempDir(prefix = 'autodocs-core-'): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  trackedTempDirs.add(dir);
  return dir;
}

export async function cleanupTempDirs(): Promise<void> {
  const dirs = Array.from(trackedTempDirs);
  trackedTempDirs.clear();
  const cwd = process.cwd();
  const remaining: string[] = [];

  await Promise.all(
    dirs.map(async (dir) => {
      if (cwd.startsWith(dir)) {
        remaining.push(dir);
        return;
      }
      await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
    })
  );

  for (const dir of remaining) {
    trackedTempDirs.add(dir);
  }
}

export async function writeTempFile(
  dir: string,
  relativePath: string,
  content: string
): Promise<string> {
  const filePath = path.join(dir, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

export function createSourceFile(content: string, fileName = 'index.ts'): ts.SourceFile {
  return ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
}

export function createDocEntry(overrides: Partial<DocEntry> = {}): DocEntry {
  return {
    id: 'example',
    name: 'Example',
    kind: 'function',
    fileName: 'src/example.ts',
    position: { line: 1, column: 0 },
    signature: 'function Example(): void',
    ...overrides,
  };
}
