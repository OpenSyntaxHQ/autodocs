import { afterAll, afterEach } from '@jest/globals';
import { cleanupTempDirs } from './helpers/temp';

afterEach(async () => {
  await cleanupTempDirs();
});

afterAll(async () => {
  await cleanupTempDirs();
});
