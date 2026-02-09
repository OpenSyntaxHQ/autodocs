#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const cliDir = path.resolve(__dirname, '..');
  const defaultUiDistDir = path.resolve(cliDir, '../ui/dist');
  const sourceUiDistDir = process.env.AUTODOCS_UI_DIST_SOURCE
    ? path.resolve(process.env.AUTODOCS_UI_DIST_SOURCE)
    : defaultUiDistDir;
  const targetUiDistDir = path.resolve(cliDir, 'ui-dist');

  if (!(await pathExists(sourceUiDistDir))) {
    console.error(
      `[prepare-ui-dist] Missing UI build at ${sourceUiDistDir}. Run "npm -w packages/ui run build" first.`
    );
    process.exit(1);
  }

  await fs.rm(targetUiDistDir, { recursive: true, force: true });
  await fs.cp(sourceUiDistDir, targetUiDistDir, { recursive: true });

  console.log(`[prepare-ui-dist] Copied ${sourceUiDistDir} -> ${targetUiDistDir}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[prepare-ui-dist] Failed: ${message}`);
  process.exit(1);
});
