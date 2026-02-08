const fs = require('fs');
const path = require('path');
const { createCoverageMap } = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'coverage-e2e');
const rawDir = path.join(outDir, 'raw');

if (!fs.existsSync(rawDir)) {
  console.log('No E2E coverage raw files found.');
  process.exit(0);
}

const coverageMap = createCoverageMap({});
const rawFiles = fs.readdirSync(rawDir).filter((file) => file.endsWith('.json'));

if (rawFiles.length === 0) {
  console.log('No E2E coverage raw files found.');
  process.exit(0);
}

for (const file of rawFiles) {
  const filePath = path.join(rawDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  coverageMap.merge(data);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'coverage-final.json'), JSON.stringify(coverageMap.toJSON()));

const context = libReport.createContext({
  dir: outDir,
  coverageMap,
});

reports.create('lcovonly').execute(context);
console.log('E2E coverage merged to coverage-e2e/lcov.info');
