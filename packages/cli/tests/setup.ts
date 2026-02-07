import { afterAll, afterEach, jest } from '@jest/globals';
import { cleanupTempDirs } from './helpers/temp';

jest.mock('ora', () => ({
  __esModule: true,
  default: () => {
    const spinner = {
      text: '',
      start: jest.fn(),
      stop: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };
    spinner.start.mockImplementation(() => spinner);
    return spinner;
  },
}));

jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

afterEach(async () => {
  await cleanupTempDirs();
});

afterAll(async () => {
  await cleanupTempDirs();
});
