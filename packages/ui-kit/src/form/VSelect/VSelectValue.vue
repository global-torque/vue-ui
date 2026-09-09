<script setup lang="ts">
import { SelectValue, type SelectValueProps } from 'reka-ui';

const props = defineProps</* @vue-ignore */ SelectValueProps>();
</script>

<template>
  <SelectValue
    v-bind="props"
    class="VSelectValue v-select-value"
  >
    <slot />
  </SelectValue>
</template>
