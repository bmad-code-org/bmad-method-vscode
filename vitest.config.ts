import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@webviews': resolve(__dirname, 'src/webviews'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    environment: 'jsdom',
    include: [
      'src/**/*.test.{ts,tsx}',
      // Include extension/parsers tests which are pure Node.js (no VSCode dependencies)
      'src/extension/parsers/**/*.test.ts',
    ],
    // Exclude extension tests that require VSCode APIs (use @vscode/test-electron)
    exclude: ['src/extension/*.test.ts', 'src/extension/services/**/*.test.ts', 'node_modules'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
    },
  },
});
