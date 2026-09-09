<script lang="ts" setup>
import { Label } from '@global-torque/ui-primitives/label';

defineProps({
  hasAsterisk: Boolean,
  disabled: Boolean,
});
</script>

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/label-has-for -->
  <Label
    v-bind="$attrs"
    class="VFormlabel v-form-label"
    :class="{ 'opacity-50': disabled, 'v-form-label--required': hasAsterisk }"
  >
    <span class="v-form-label__content"><slot /></span>
    <span
      v-if="hasAsterisk"
      class="v-form-label__asterisk text-destructive"
      aria-hidden="true"
    >*</span>
  </Label>
</template>
