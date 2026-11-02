import { defineConfig } from 'vitest/config';

// Mirrors the former jest.config.js.
export default defineConfig({
  test: {
    // Tests use describe/test/expect/vi without importing them
    globals: true,
    environment: 'node',
    include: ['**/tests/**/*.test.js'],
    testTimeout: 10000,
    reporters: ['verbose'],
    coverage: {
      provider: 'istanbul',
      // Like Jest's collectCoverageFrom: every source file is reported, tested or not
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', '**/node_modules/**'],
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
