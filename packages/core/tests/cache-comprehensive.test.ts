import fs from 'fs/promises';
import path from 'path';
import { FileCache } from '../src/cache/FileCache';
import { VERSION } from '../src/version';
import { createTempDir } from './helpers/fixtures';

describe('FileCache Comprehensive', () => {
  it('recovers from corrupted index', async () => {
    const tempDir = await createTempDir('autodocs-cache-');
    const cacheDir = path.join(tempDir, 'cache');
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(path.join(cacheDir, 'index.json'), '{not-json', 'utf-8');

    const cache = new FileCache({ cacheDir });
    const entry = await cache.getEntry(path.join(tempDir, 'missing.ts'));
    expect(entry).toBeNull();

    const filePath = path.join(tempDir, 'src', 'example.ts');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, 'export const value = 1;', 'utf-8');

    await cache.set(filePath, [{ id: 'example' }], [], {
      version: VERSION,
      tsVersion: 'test',
      configHash: 'hash',
    });

    const stored = await cache.getEntry(filePath);
    expect(stored).not.toBeNull();
  });

  it('removes orphan docs files on invalidate', async () => {
    const tempDir = await createTempDir('autodocs-cache-');
    const cacheDir = path.join(tempDir, 'cache');
    const docsDir = path.join(cacheDir, 'docs');
    await fs.mkdir(docsDir, { recursive: true });
    const orphanPath = path.join(docsDir, 'orphan.json');
    await fs.writeFile(orphanPath, JSON.stringify([{ id: 'orphan' }]), 'utf-8');

    const cache = new FileCache({ cacheDir });
    await cache.invalidate(path.join(tempDir, 'missing.ts'));

    await expect(fs.access(orphanPath)).rejects.toThrow();
  });

  it('returns empty docs if docs file is missing', async () => {
    const tempDir = await createTempDir('autodocs-cache-');
    const cacheDir = path.join(tempDir, 'cache');
    const cache = new FileCache({ cacheDir });

    const docs = await cache.readDocs({
      fileHash: 'hash',
      timestamp: Date.now(),
      docsFile: 'docs/missing.json',
      dependencies: [],
      metadata: { version: VERSION, tsVersion: 'test', configHash: 'hash' },
    });

    expect(docs).toEqual([]);
  });
});
