<script setup lang="ts">
import { ChevronUp as ChevronUp } from '@lucide/vue';
import { SelectScrollUpButton, type SelectScrollUpButtonProps, useForwardProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<{ class?: HTMLAttributes['class'] } & /* @vue-ignore */ SelectScrollUpButtonProps>();

const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused; // Explicitly mark as intentionally unused

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectScrollUpButton
    v-bind="forwardedProps"
    :class="props.class"
    class="VSelectScrollUpButton v-select-scroll-up-button"
  >
    <slot>
      <ChevronUp class="h-4 w-4" />
    </slot>
  </SelectScrollUpButton>
</template>
