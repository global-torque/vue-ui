<script setup lang="ts">
import { SelectItemText, type SelectItemTextProps } from 'reka-ui';

const props = defineProps</* @vue-ignore */ SelectItemTextProps>();
</script>

<template>
  <SelectItemText
    v-bind="props"
    class="VSelectItemText v-select-item-text"
  >
    <slot />
  </SelectItemText>
</template>
