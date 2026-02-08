import { test as base, expect, type Page, type TestInfo } from '@playwright/test';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import v8toIstanbul from 'v8-to-istanbul';

const COVERAGE_ENV = 'E2E_COVERAGE';
const ROOT_DIR = process.cwd();
const DOCS_DIST = path.join(ROOT_DIR, 'docs-dist');
const RAW_DIR = path.join(ROOT_DIR, 'coverage-e2e', 'raw');

function shouldCollect(testInfo: TestInfo): boolean {
  return process.env[COVERAGE_ENV] === '1' && testInfo.project.name === 'chromium';
}

function getOutputPath(testInfo: TestInfo): string {
  const hash = createHash('sha256').update(testInfo.testId).digest('hex').slice(0, 12);
  return path.join(
    RAW_DIR,
    `${testInfo.project.name}-${String(testInfo.workerIndex)}-${hash}.json`
  );
}

async function convertCoverage(page: Page, testInfo: TestInfo): Promise<void> {
  const entries = await page.coverage.stopJSCoverage();
  const coverageMap: Record<string, unknown> = {};

  for (const entry of entries) {
    if (!entry.url || !entry.url.startsWith('http')) {
      continue;
    }

    const url = new URL(entry.url);
    if (!url.pathname.endsWith('.js')) {
      continue;
    }

    const filePath = path.join(DOCS_DIST, decodeURIComponent(url.pathname));
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const converter = v8toIstanbul(filePath, 0, { source: entry.source });
    await converter.load();
    converter.applyCoverage(entry.functions);
    Object.assign(coverageMap, converter.toIstanbul());
  }

  if (Object.keys(coverageMap).length === 0) {
    return;
  }

  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(getOutputPath(testInfo), JSON.stringify(coverageMap));
}

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use, testInfo) => {
    const collect = shouldCollect(testInfo);

    if (collect) {
      await page.coverage.startJSCoverage({
        resetOnNavigation: false,
        reportAnonymousScripts: true,
      });
    }

    await use(page);

    if (collect) {
      await convertCoverage(page, testInfo);
    }
  },
});

export { expect };
