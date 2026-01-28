// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig(
  // ============================================================================
  // BASE CONFIGS
  // ============================================================================
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  prettierConfig,

  // ============================================================================
  // TYPESCRIPT - TYPE-AWARE LINTING
  // ============================================================================
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['vite.config.ts', 'vitest.config.ts', 'eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // ============================================================================
  // REACT CONFIGS
  // ============================================================================
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,

  // ============================================================================
  // WEBVIEW FILES - React + browser globals
  // ============================================================================
  {
    files: ['src/webviews/**/*.{ts,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
      prettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      'react-refresh/only-export-components': 'error',

      // REACT - RE-ENABLED FOR BETTER CODE QUALITY
      'react/no-unescaped-entities': 'warn',
      'react/no-unknown-property': [
        'error',
        {
          ignore: ['css'],
        },
      ],

      // REACT - DISABLED (CORRECT FOR REACT 19 + TYPESCRIPT)
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // GENERAL - DISABLED (INTENTIONAL)
      'default-case': 'off',
      'no-nested-ternary': 'off',

      // BOUNDARY ENFORCEMENT: Webview cannot import from extension
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/extension/**'],
              message:
                'Webview code cannot import from extension host. Use shared types via @shared/ instead.',
            },
          ],
        },
      ],
    },
  },

  // ============================================================================
  // EXTENSION HOST FILES - Node.js globals + boundary enforcement
  // ============================================================================
  {
    files: ['src/extension/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // BOUNDARY ENFORCEMENT: Extension cannot import from webviews
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/webviews/**'],
              message:
                'Extension host code cannot import from webviews. Use shared types via src/shared/ instead.',
            },
          ],
        },
      ],
    },
  },

  // ============================================================================
  // ALL TYPESCRIPT FILES
  // ============================================================================
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      prettier,
    },
    rules: {
      // PRETTIER
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      // TYPESCRIPT - STRICT TYPE SAFETY
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/default-param-last': 'error',
      '@typescript-eslint/member-ordering': 0,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_|^err|^error',
          argsIgnorePattern: '^_|props|^_error',
        },
      ],

      // GENERAL CODE QUALITY
      'no-console': 'warn',
      'no-multi-assign': 'error',
      'no-new': 'error',
      'no-new-object': 'error',
      'no-new-wrappers': 'error',
      'no-path-concat': 'error',
      'no-return-await': 'error',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-shadow-restricted-names': 'error',

      // MODERN JAVASCRIPT PREFERENCES
      'prefer-numeric-literals': 'error',
      'prefer-object-spread': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      'symbol-description': 'error',

      // ASYNC/AWAIT PATTERNS
      'no-await-in-loop': 'error',
    },
  },

  // ============================================================================
  // CONFIG FILES - DISABLE TYPE-CHECKED RULES
  // ============================================================================
  {
    files: ['vite.config.ts', 'vitest.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },

  // ============================================================================
  // IGNORES
  // ============================================================================
  {
    ignores: ['out/', 'node_modules/', '.vscode-test/', '*.js', '*.mjs'],
  }
);
