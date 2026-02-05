const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.error('Usage: node scripts/version.js <version>');
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

for (const pkgPath of packageFiles) {
  const absolutePath = path.resolve(__dirname, '..', pkgPath);
  const pkg = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
  pkg.version = version;
  fs.writeFileSync(absolutePath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Updated ${pkgPath} to ${version}`);
}

const coreVersionPath = path.resolve(__dirname, '..', 'packages/core/src/version.ts');
const versionSource = `export const VERSION = '${version}';\n`;
fs.writeFileSync(coreVersionPath, versionSource);
console.log(`Updated packages/core/src/version.ts to ${version}`);

console.log('✓ Version update complete');
