<script setup lang="ts">
import { ChevronDown as ChevronDown } from '@lucide/vue';
import { SelectScrollDownButton, type SelectScrollDownButtonProps, useForwardProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<{ class?: HTMLAttributes['class'] } & /* @vue-ignore */ SelectScrollDownButtonProps>();
const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused; // Explicitly mark as intentionally unused

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectScrollDownButton
    v-bind="forwardedProps"
    :class="props.class"
    class="VSelectScrollDownButton v-select-scroll-down-button"
  >
    <slot>
      <ChevronDown class="h-4 w-4" />
    </slot>
  </SelectScrollDownButton>
</template>
