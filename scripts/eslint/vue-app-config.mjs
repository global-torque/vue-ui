import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript';
import importPlugin from 'eslint-plugin-import';
import pluginVue from 'eslint-plugin-vue';
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility';
import globals from 'globals';

const browserGlobals = Object.fromEntries(
  Object.entries(globals.browser).map(([key, value]) => [key.trim(), value]),
);

/** @typedef {Record<string, any>} RuleMap */

/** @type {any[]} */
export const vueMaxLenRule = ['warn', {
  code: 120,
  ignoreComments: true,
  ignoreStrings: true,
  ignoreTemplateLiterals: true,
  ignoreUrls: true,
}];

/** @type {RuleMap} */
export const relaxedVueScriptRules = {
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/no-explicit-any': ['warn'],
  '@typescript-eslint/no-unused-vars': 'off',
  'prefer-rest-params': ['warn'],
  'vue/max-len': vueMaxLenRule,
  'vue/require-default-prop': 'off',
};

/** @type {RuleMap} */
const commonScriptRules = {
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/no-empty-object-type': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
      {
        caughtErrors: 'none',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
  ],
  camelcase: 'off',
  'import/no-named-as-default': 'off',
  'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  'no-underscore-dangle': 'off',
  'no-unused-vars': 'off',
  'vue/max-len': vueMaxLenRule,
};

/**
 * @param {{
 *   extraConfigs?: any[];
 *   ignores?: string[];
 *   includeAccessibility?: boolean;
 *   includeStylistic?: boolean;
 *   scriptRules?: RuleMap;
 *   vueRules?: RuleMap | null;
 * }} [options]
 */
export function createVueAppConfig(options = {}) {
  const {
    extraConfigs = [],
    ignores = [],
    includeAccessibility = false,
    includeStylistic = true,
    scriptRules = {},
    vueRules = null,
  } = options;

  return defineConfigWithVueTs(
    {
      ignores,
    },
    ...pluginVue.configs['flat/recommended'],
    ...(includeAccessibility ? pluginVueA11y.configs['flat/recommended'] : []),
    vueTsConfigs.recommended,
    ...(includeStylistic
      ? [stylistic.configs.customize({
        indent: 2,
        jsx: false,
        quotes: 'single',
        semi: true,
      })]
      : []),
    {
      files: ['**/*.+(ts|tsx|mts|cts|js|mjs|cjs|jsx)'],
      languageOptions: {
        ecmaVersion: 'latest',
        globals: browserGlobals,
        parser: tsParser,
        sourceType: 'module',
      },
      plugins: {
        import: importPlugin,
      },
      rules: {
        ...commonScriptRules,
        ...scriptRules,
      },
    },
    ...(vueRules
      ? [{
        files: ['**/*.vue'],
        rules: vueRules,
      }]
      : []),
    ...extraConfigs,
  );
}
