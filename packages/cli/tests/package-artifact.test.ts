import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createTempDir } from './helpers/temp';

const execFileAsync = promisify(execFile);

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function parsePackJson(output: string): Array<{ files?: Array<{ path: string }> }> {
  const match = output.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/);
  if (!match) {
    throw new Error('npm pack did not produce JSON output');
  }

  const jsonPayload = match[0];
  return JSON.parse(jsonPayload) as Array<{ files?: Array<{ path: string }> }>;
}

describe('CLI package artifact', () => {
  it('includes bundled ui-dist assets in npm pack output', async () => {
    const cliDir = path.resolve(__dirname, '..');
    const sourceUiDist = await createTempDir('autodocs-ui-dist-');
    const npmCacheRoot = await createTempDir('autodocs-npm-cache-');
    const packagedUiDist = path.join(cliDir, 'ui-dist');
    const packagedUiDistBackup = path.join(cliDir, 'ui-dist.__bak__');
    const hadPackagedUiDist = await pathExists(packagedUiDist);

    await fs.mkdir(path.join(sourceUiDist, 'assets'), { recursive: true });
    await fs.writeFile(
      path.join(sourceUiDist, 'index.html'),
      '<html><body><div id="root"></div></body></html>',
      'utf-8'
    );
    await fs.writeFile(path.join(sourceUiDist, 'assets', 'app.js'), 'console.log("ui");', 'utf-8');

    if (hadPackagedUiDist) {
      await fs.rm(packagedUiDistBackup, { recursive: true, force: true });
      await fs.rename(packagedUiDist, packagedUiDistBackup);
    }

    try {
      const { stdout } = await execFileAsync('npm', ['pack', '--dry-run', '--json'], {
        cwd: cliDir,
        env: {
          ...process.env,
          AUTODOCS_UI_DIST_SOURCE: sourceUiDist,
          npm_config_cache: path.join(npmCacheRoot, 'cache'),
        },
      });

      const packed = parsePackJson(stdout);
      const packedPaths = new Set((packed[0]?.files || []).map((entry) => entry.path));

      expect(packedPaths.has('ui-dist/index.html')).toBe(true);
      expect(Array.from(packedPaths).some((entry) => entry.startsWith('ui-dist/assets/'))).toBe(
        true
      );
    } finally {
      await fs.rm(packagedUiDist, { recursive: true, force: true });
      if (hadPackagedUiDist && (await pathExists(packagedUiDistBackup))) {
        await fs.rename(packagedUiDistBackup, packagedUiDist);
      } else {
        await fs.rm(packagedUiDistBackup, { recursive: true, force: true });
      }
    }
  });
});
