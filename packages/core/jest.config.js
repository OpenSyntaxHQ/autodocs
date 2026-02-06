/* global module, process */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  testTimeout: 20000,
  coverageThreshold: {
    global: (() => {
      const stage = Number(process.env.COVERAGE_STAGE || '1');
      if (stage >= 3) {
        return {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        };
      }
      if (stage >= 2) {
        return {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        };
      }
      return {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60,
      };
    })(),
  },
};
