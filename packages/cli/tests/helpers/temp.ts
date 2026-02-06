import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const trackedTempDirs = new Set<string>();

export async function createTempDir(prefix = 'autodocs-cli-'): Promise<string> {
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
