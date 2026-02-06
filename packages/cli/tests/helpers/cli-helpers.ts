import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createTempDir } from './temp';

export async function createTempProject(files: Record<string, string>): Promise<string> {
  const dir = await createTempDir('autodocs-cli-');

  await Promise.all(
    Object.entries(files).map(async ([relativePath, content]) => {
      const filePath = path.join(dir, relativePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    })
  );

  return dir;
}

export function getCliEntry(): string {
  return path.resolve(__dirname, '..', '..', 'dist', 'index.js');
}

const execFileAsync = promisify(execFile);

export async function runCli(
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv; reject?: boolean } = {}
) {
  try {
    return await execFileAsync(process.execPath, [getCliEntry(), ...args], {
      cwd: options.cwd,
      env: options.env,
    });
  } catch (error) {
    if (options.reject === false) {
      return error as Error & { stdout?: string; stderr?: string };
    }
    throw error;
  }
}

export function mockSpinner() {
  return {
    text: '',
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
  };
}
