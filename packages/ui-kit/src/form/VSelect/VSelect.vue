<script setup lang="ts">
import type { AcceptableValue, SelectRootProps } from 'reka-ui';
import { SelectRoot, useForwardPropsEmits } from 'reka-ui';

const props = defineProps</* @vue-ignore */ SelectRootProps>();
const emits = defineEmits<{
  'update:modelValue': [value: AcceptableValue];
  'update:open': [value: boolean];
}>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <SelectRoot
    v-bind="forwarded"
    class="VSelect v-select"
  >
    <slot />
  </SelectRoot>
</template>
