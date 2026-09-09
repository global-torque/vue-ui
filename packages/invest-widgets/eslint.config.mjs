import {
  createVueAppConfig,
} from '../../scripts/eslint/vue-app-config.mjs';

export default createVueAppConfig({
  ignores: [
    '**/dist/**',
    '**/node_modules/**',
  ],
  includeAccessibility: true,
  includeStylistic: false,
  scriptRules: {
    'vue/max-len': 'off',
    'vue/require-default-prop': 'off',
  },
  vueRules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'vue/max-len': 'off',
    'vue/require-default-prop': 'off',
  },
});
