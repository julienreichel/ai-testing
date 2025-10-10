import js from '@eslint/js';
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

// Constants for code quality rules
const MAX_NESTING_DEPTH = 4;
const MAX_FUNCTION_PARAMETERS = 4;

export default defineConfigWithVueTs(
  {
    /**
     * Ignore the following files.
     * Please note that pluginQuasar.configs.recommended() already ignores
     * the "node_modules" folder for you (and all other Quasar project
     * relevant folders and files).
     *
     * ESLint requires "ignores" key to be the only one in this object
     */
    ignores: ['.amplify/**'],
  },

  js.configs.recommended,

  /**
   * https://eslint.vuejs.org
   *
   * pluginVue.configs.base
   *   -> Settings and rules to enable correct ESLint parsing.
   * pluginVue.configs[ 'flat/essential']
   *   -> base, plus rules to prevent errors or unintended behavior.
   * pluginVue.configs["flat/strongly-recommended"]
   *   -> Above, plus rules to considerably improve code readability and/or dev experience.
   * pluginVue.configs["flat/recommended"]
   *   -> Above, plus rules to enforce subjective community defaults to ensure consistency.
   */
  pluginVue.configs['flat/essential'],

  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  // https://github.com/vuejs/eslint-config-typescript
  vueTsConfigs.recommendedTypeChecked,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node, // SSR, Electron, config files
        process: 'readonly', // process.env.*
        ga: 'readonly', // Google Analytics
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly', // BEX related
        browser: 'readonly', // BEX related
      },
    },

    // add your custom rules here
    rules: {
      'prefer-promise-reject-errors': 'off',

      // allow debugger during development only
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

      // Code Quality Rules
      complexity: ['error', { max: 16 }], // Limit cyclomatic complexity
      'max-depth': ['error', MAX_NESTING_DEPTH], // Limit nesting depth
      'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', MAX_FUNCTION_PARAMETERS], // Limit function parameters
      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      // Vue specific rules
      'vue/max-attributes-per-line': ['error', { singleline: 3, multiline: 1 }],
      'vue/component-name-in-template-casing': ['error', 'kebab-case'],
      'vue/require-default-prop': 'error',
      'vue/require-prop-types': 'error',

      // General best practices
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      eqeqeq: ['error', 'always'],
    },
  },

  // Relaxed rules for test files
  {
    files: ['test/**/*.{ts,js}', '**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
    rules: {
      // Allow much longer functions in tests (comprehensive test suites)
      'max-lines-per-function': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      complexity: ['error', { max: 30 }],

      // Allow more magic numbers in tests (test data, expectations, etc.)
      'no-magic-numbers': 'off',

      // Allow more parameters for test setup functions
      'max-params': 'off',

      // Tests can be deeply nested (describe > describe > it > expect)
      'max-depth': 'off',
    },
  },

  {
    files: ['src-pwa/custom-service-worker.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },

  prettierSkipFormatting,
);
