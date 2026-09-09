import {
  createVueAppConfig,
} from '../../scripts/eslint/vue-app-config.mjs';

export default createVueAppConfig({
  ignores: ['**/coverage/**', '**/node_modules/**'],
  includeAccessibility: true,
  includeStylistic: false,
  scriptRules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'vue/max-len': 'off',
    'vue/require-default-prop': 'off',
  },
  vueRules: {
    // Generated shadcn-vue components: registry names and conventions apply.
    // Generic controls are labelled by the consumer, and the carousel and
    // input-group roots are upstream-designed interactive containers.
    'vuejs-accessibility/click-events-have-key-events': 'off',
    'vuejs-accessibility/form-control-has-label': 'off',
    'vuejs-accessibility/label-has-for': 'off',
    'vuejs-accessibility/no-static-element-interactions': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/max-len': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-required-prop-with-default': 'off',
    'vue/one-component-per-file': 'off',
    'vue/require-default-prop': 'off',
  },
});
