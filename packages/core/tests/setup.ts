import { afterAll, afterEach } from '@jest/globals';
import { cleanupTempDirs } from './helpers/fixtures';

afterEach(async () => {
  await cleanupTempDirs();
});

afterAll(async () => {
  await cleanupTempDirs();
});
