#!/usr/bin/env node

const { execFile } = require('child_process');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

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
  const uiDistDir = path.join(repoRoot, 'packages', 'ui', 'dist');

  const { stdout } = await execFileAsync('npm', ['pack', '--dry-run', '--json'], {
    cwd: cliDir,
    env: {
      ...process.env,
      AUTODOCS_UI_DIST_SOURCE: uiDistDir,
      npm_config_cache: '/tmp/npm-cache',
    },
  });

  let packed;
  try {
    packed = parsePackJson(stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse npm pack output: ${message}`);
  }

  const files = new Set((packed[0]?.files || []).map((entry) => entry.path));

  if (!files.has('ui-dist/index.html')) {
    throw new Error('CLI pack output is missing ui-dist/index.html');
  }

  const hasUiAssets = Array.from(files).some((entry) => entry.startsWith('ui-dist/assets/'));
  if (!hasUiAssets) {
    throw new Error('CLI pack output is missing ui-dist/assets/*');
  }

  console.log('[verify-cli-pack] CLI package contains bundled UI assets');
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[verify-cli-pack] ${message}`);
  process.exit(1);
});
