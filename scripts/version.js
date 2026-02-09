const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.error('Usage: node scripts/version.js <version>');
  process.exit(1);
}

const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
if (!semverPattern.test(version)) {
  console.error(`Invalid version "${version}". Expected semver format (e.g. 2.1.0)`);
  process.exit(1);
}

const packageFiles = [
  'package.json',
  'packages/core/package.json',
  'packages/cli/package.json',
  'packages/ui/package.json',
  'packages/plugins/markdown/package.json',
  'packages/plugins/examples/package.json',
];

const dependencyFields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

function readPackageJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Package file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${filePath}: ${message}`);
  }
}

try {
  const packageEntries = packageFiles.map((pkgPath) => {
    const absolutePath = path.resolve(__dirname, '..', pkgPath);
    const pkg = readPackageJson(absolutePath);
    return { pkgPath, absolutePath, pkg };
  });

  const internalPackageNames = new Set(
    packageEntries
      .map((entry) => entry.pkg.name)
      .filter((name) => typeof name === 'string' && name.startsWith('@opensyntaxhq/'))
  );

  for (const entry of packageEntries) {
    const { pkgPath, absolutePath, pkg } = entry;
    pkg.version = version;

    for (const field of dependencyFields) {
      const deps = pkg[field];
      if (!deps || typeof deps !== 'object') {
        continue;
      }

      for (const depName of Object.keys(deps)) {
        if (!internalPackageNames.has(depName)) {
          continue;
        }
        deps[depName] = `^${version}`;
      }
    }

    fs.writeFileSync(absolutePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated ${pkgPath} to ${version}`);
  }

  const coreVersionPath = path.resolve(__dirname, '..', 'packages/core/src/version.ts');
  const versionSource = `export const VERSION = '${version}';\n`;
  fs.writeFileSync(coreVersionPath, versionSource);
  console.log(`Updated packages/core/src/version.ts to ${version}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to update version: ${message}`);
  process.exit(1);
}

console.log('✓ Version update complete');
