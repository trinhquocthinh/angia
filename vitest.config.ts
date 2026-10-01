import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const apiSrc = fileURLToPath(new URL('./apps/api/src', import.meta.url));
const workerSrc = fileURLToPath(new URL('./apps/worker/src', import.meta.url));
const webSrc = fileURLToPath(new URL('./apps/web/src', import.meta.url));

// Mỗi workspace có alias @src riêng nên tách thành từng project con.
const aliasFor = (dir: string) => ({ '@src': dir });

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['apps/*/src/features/*/{domain,application}/**/*.ts'],
      exclude: ['**/*.test.ts', '**/ports.ts'],
      thresholds: { lines: 80 },
    },
    projects: [
      {
        extends: false,
        resolve: { alias: aliasFor(apiSrc) },
        test: {
          name: 'unit',
          include: ['apps/api/src/**/*.test.ts', 'packages/*/src/**/*.test.ts', 'tooling/**/*.test.ts'],
          exclude: ['**/*.int.test.ts', '**/node_modules/**'],
          environment: 'node',
        },
      },
      {
        extends: false,
        resolve: { alias: aliasFor(workerSrc) },
        test: {
          name: 'unit-worker',
          include: ['apps/worker/src/**/*.test.ts'],
          exclude: ['**/*.int.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: false,
        resolve: { alias: aliasFor(webSrc) },
        test: {
          name: 'unit-web',
          include: ['apps/web/src/**/*.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        extends: false,
        resolve: { alias: aliasFor(apiSrc) },
        test: {
          name: 'int',
          include: ['apps/api/src/**/*.int.test.ts'],
          environment: 'node',
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
