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
  coverageThreshold: {
    global: (() => {
      const stage = Number(process.env.COVERAGE_STAGE || '1');
      if (stage >= 3) {
        return {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        };
      }
      if (stage >= 2) {
        return {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        };
      }
      return {
        branches: 40,
        functions: 45,
        lines: 45,
        statements: 45,
      };
    })(),
  },
};
