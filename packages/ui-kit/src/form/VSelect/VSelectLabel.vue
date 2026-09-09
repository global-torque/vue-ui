<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { SelectLabel, type SelectLabelProps } from 'reka-ui';

const props = defineProps<{ class?: HTMLAttributes['class'] } & /* @vue-ignore */ SelectLabelProps>();
</script>

<template>
  <SelectLabel
    :class="props.class"
    class="VSelectLabel v-select-llabel"
  >
    <slot />
  </SelectLabel>
</template>
