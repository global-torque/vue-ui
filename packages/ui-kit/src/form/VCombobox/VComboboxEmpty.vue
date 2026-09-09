<script setup lang="ts">
import { ComboboxEmpty, type ComboboxEmptyProps } from 'reka-ui';

const props = defineProps<ComboboxEmptyProps>();
</script>

<template>
  <ComboboxEmpty
    v-bind="props"
    class="VComboboxEmpty v-combobox-empty"
  >
    <slot />
  </ComboboxEmpty>
</template>

<style lang="scss">
.v-combobox-empty {
  font-family: var(--font-sans);
    color: var(--foreground);
    padding: 12px;
    cursor: pointer;
    font-size: 16px;
    line-height: 26px;
}
</style>
