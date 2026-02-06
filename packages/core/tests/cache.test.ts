import fs from 'fs/promises';
import path from 'path';
import { FileCache } from '../src/cache/FileCache';
import { createTempDir } from './helpers/fixtures';
import { VERSION } from '../src/version';

const metadata = {
  version: VERSION,
  tsVersion: 'test',
  configHash: 'hash',
};

describe('FileCache', () => {
  it('stores and retrieves docs entries', async () => {
    const tempDir = await createTempDir('autodocs-cache-');
    const cacheDir = path.join(tempDir, 'cache');
    const filePath = path.join(tempDir, 'src', 'example.ts');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, 'export const value = 1;', 'utf-8');

    const cache = new FileCache({ cacheDir });
    await cache.set(filePath, [{ id: 'example' }], [], metadata);

    const entry = await cache.getEntry(filePath);
    expect(entry).not.toBeNull();
    if (!entry) {
      throw new Error('Cache entry missing');
    }
    const docs = await cache.readDocs(entry);
    expect(docs).toHaveLength(1);
    expect((docs[0] as { id: string }).id).toBe('example');
  });

  it('invalidates dependent entries', async () => {
    const tempDir = await createTempDir('autodocs-cache-');
    const cacheDir = path.join(tempDir, 'cache');
    const fileA = path.join(tempDir, 'src', 'a.ts');
    const fileB = path.join(tempDir, 'src', 'b.ts');
    await fs.mkdir(path.dirname(fileA), { recursive: true });
    await fs.writeFile(fileA, 'export const a = 1;', 'utf-8');
    await fs.writeFile(fileB, 'export const b = 2;', 'utf-8');

    const cache = new FileCache({ cacheDir });
    await cache.set(fileB, [{ id: 'b' }], [], metadata);
    await cache.set(fileA, [{ id: 'a' }], [fileB], metadata);

    const entryA = await cache.getEntry(fileA);
    const entryB = await cache.getEntry(fileB);
    expect(entryA).not.toBeNull();
    expect(entryB).not.toBeNull();

    await cache.invalidate(fileB);

    const remainingA = await cache.getEntry(fileA);
    const remainingB = await cache.getEntry(fileB);
    expect(remainingA).toBeNull();
    expect(remainingB).toBeNull();
  });
});
