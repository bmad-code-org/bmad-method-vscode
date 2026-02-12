import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  // Only run tests that require VS Code runtime (mocha-based)
  // Parser tests use vitest and are run via `pnpm test`
  files: [
    'out/extension/extension.test.js',
    'out/extension/services/**/*.test.js',
    'out/extension/providers/**/*.test.js',
  ],
  workspaceFolder: '.',
  launchArgs: ['--disable-extensions'],
  mocha: {
    ui: 'tdd',
  },
});
