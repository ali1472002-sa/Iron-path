import { defineConfig } from 'vitest/config';
// Tests cover the data layer and pure logic only (no React rendering), so the Node environment + fake-indexeddb is enough.
export default defineConfig({
  test: { environment: 'node', setupFiles: ['tests/setup.ts'], include: ['tests/**/*.test.ts'], testTimeout: 10000 },
});
