#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

async function runCommand(command, args, options) {
  return execFileAsync(command, args, options);
}

function parsePackJson(output) {
  const match = output.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/);
  if (!match) {
    throw new Error('npm pack did not produce JSON output');
  }

  const jsonPayload = match[0];
  return JSON.parse(jsonPayload);
}

async function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const cliDir = path.join(repoRoot, 'packages', 'cli');
  const uiDistDir = process.env.AUTODOCS_UI_DIST_SOURCE
    ? path.resolve(process.env.AUTODOCS_UI_DIST_SOURCE)
    : path.join(repoRoot, 'packages', 'ui', 'dist');
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'autodocs-cli-smoke-'));
  const extractDir = path.join(tmpRoot, 'extract');
  const fixtureDir = path.join(tmpRoot, 'fixture');
  const npmCache = path.join(tmpRoot, 'npm-cache');

  let tarballPath;

  try {
    const { stdout: packStdout } = await runCommand('npm', ['pack', '--json'], {
      cwd: cliDir,
      env: {
        ...process.env,
        AUTODOCS_UI_DIST_SOURCE: uiDistDir,
        npm_config_cache: npmCache,
      },
    });

    const packed = parsePackJson(packStdout);
    const tarballFile = packed[0]?.filename;
    if (!tarballFile) {
      throw new Error('npm pack did not return a tarball filename');
    }

    tarballPath = path.join(cliDir, tarballFile);

    await fs.mkdir(extractDir, { recursive: true });
    await runCommand('tar', ['-xzf', tarballPath, '-C', extractDir], { cwd: repoRoot });

    const extractedPackageDir = path.join(extractDir, 'package');
    const extractedNodeModulesDir = path.join(extractedPackageDir, 'node_modules');
    const extractedCoreScopeDir = path.join(extractedNodeModulesDir, '@opensyntaxhq');
    const extractedCoreLink = path.join(extractedCoreScopeDir, 'autodocs-core');
    const localCorePackageDir = path.join(repoRoot, 'packages', 'core');

    await fs.mkdir(extractedCoreScopeDir, { recursive: true });
    await fs.rm(extractedCoreLink, { recursive: true, force: true });
    await fs.symlink(localCorePackageDir, extractedCoreLink, 'dir');

    const cliEntry = path.join(extractedPackageDir, 'dist', 'index.js');

    await fs.mkdir(path.join(fixtureDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(fixtureDir, 'src', 'index.ts'), 'export const value = 1;\n', 'utf-8');
    await fs.writeFile(
      path.join(fixtureDir, 'autodocs.config.json'),
      JSON.stringify(
        {
          include: ['src/**/*.ts'],
          output: { dir: './docs-dist', format: 'static', clean: true },
        },
        null,
        2
      ),
      'utf-8'
    );

    const nodePathParts = [path.join(repoRoot, 'node_modules')];
    if (process.env.NODE_PATH) {
      nodePathParts.push(process.env.NODE_PATH);
    }

    await runCommand(
      process.execPath,
      [cliEntry, 'build', '--config', path.join(fixtureDir, 'autodocs.config.json')],
      {
        cwd: fixtureDir,
        env: {
          ...process.env,
          NODE_PATH: nodePathParts.join(path.delimiter),
          npm_config_cache: npmCache,
        },
      }
    );

    const outputDir = path.join(fixtureDir, 'docs-dist');
    const indexHtmlPath = path.join(outputDir, 'index.html');
    const docsJsonPath = path.join(outputDir, 'docs.json');
    const configJsonPath = path.join(outputDir, 'config.json');

    await fs.access(indexHtmlPath);
    await fs.access(docsJsonPath);
    await fs.access(configJsonPath);

    const indexHtml = await fs.readFile(indexHtmlPath, 'utf-8');
    if (!indexHtml.includes('<div id="root"></div>')) {
      throw new Error('Generated index.html does not appear to be React UI output');
    }

    console.log('[smoke-cli-tarball] Packed CLI generated React UI output successfully');
  } finally {
    if (tarballPath) {
      await fs.rm(tarballPath, { force: true }).catch(() => undefined);
    }
    await fs.rm(tmpRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[smoke-cli-tarball] ${message}`);
  process.exit(1);
});
