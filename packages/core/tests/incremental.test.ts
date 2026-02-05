import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { FileCache } from '../src/cache/FileCache';
import { incrementalBuild } from '../src/cache/incremental';

async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

describe('incrementalBuild', () => {
  it('reuses cache for unchanged files', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autodocs-inc-'));
    const cache = new FileCache({ cacheDir: path.join(tempDir, 'cache') });
    const fileA = path.join(tempDir, 'src', 'a.ts');

    await writeFile(fileA, 'export const value = 1;');

    const files = [fileA];
    const first = await incrementalBuild({
      files,
      cache,
      configHash: 'hash-a',
    });

    expect(first.changedFiles).toHaveLength(1);
    expect(first.docs.length).toBeGreaterThan(0);

    const second = await incrementalBuild({
      files,
      cache,
      configHash: 'hash-a',
    });

    expect(second.changedFiles).toHaveLength(0);
    expect(second.fromCache).toBeGreaterThan(0);
  });

  it('invalidates dependent files when a dependency changes', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autodocs-inc-'));
    const cache = new FileCache({ cacheDir: path.join(tempDir, 'cache') });
    const fileA = path.join(tempDir, 'src', 'a.ts');
    const fileB = path.join(tempDir, 'src', 'b.ts');

    await writeFile(fileB, 'export const foo = 1;');
    await writeFile(fileA, "export { foo } from './b';");

    const files = [fileA, fileB];
    await incrementalBuild({
      files,
      cache,
      configHash: 'hash-a',
    });

    await writeFile(fileB, 'export const foo = 2;');

    const result = await incrementalBuild({
      files,
      cache,
      configHash: 'hash-a',
    });

    expect(result.changedFiles).toEqual(expect.arrayContaining([fileA, fileB]));
  });

  it('invalidates cache when config hash changes', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autodocs-inc-'));
    const cache = new FileCache({ cacheDir: path.join(tempDir, 'cache') });
    const fileA = path.join(tempDir, 'src', 'a.ts');

    await writeFile(fileA, 'export const value = 1;');

    const files = [fileA];
    await incrementalBuild({
      files,
      cache,
      configHash: 'hash-a',
    });

    const second = await incrementalBuild({
      files,
      cache,
      configHash: 'hash-b',
    });

    expect(second.changedFiles).toHaveLength(1);
    expect(second.fromCache).toBe(0);
  });
});
