import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/extension/**/*.test.js',
  workspaceFolder: '.',
  launchArgs: ['--disable-extensions'],
  mocha: {
    ui: 'tdd',
  },
});
