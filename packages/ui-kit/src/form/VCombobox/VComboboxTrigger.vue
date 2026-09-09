<script setup lang="ts">
import { ChevronDown as ChevronDown } from '@lucide/vue';
import {
  ComboboxTrigger, type ComboboxTriggerProps, useForwardProps,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = withDefaults(defineProps<ComboboxTriggerProps & {
  class?: HTMLAttributes['class'],
  size?: 'large' | 'medium';
}>(), {
  size: 'large',
});

const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused; // Explicitly mark as intentionally unused

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ComboboxTrigger
    v-bind="forwardedProps"
    :class="[props.class, `is--size-${size}`]"
    class="VComboboxTrigger v-combobox-trigger"
  >
    <slot />
    <slot name="icon">
      <ChevronDown class="v-combobox-trigger__icon" />
    </slot>
  </ComboboxTrigger>
</template>

<style lang="scss">
.v-combobox-trigger {
  display: flex;
  align-items: center;

  &__icon {
    width: 14px;
    color: var(--ui-color-text-muted, #495057);
    transition: all 0.3s;
    transform-origin: center;
    transform: rotate(0);
    margin-left: 9px;
    margin-top: 0 !important;
  }
}

.v-combobox-trigger[data-state="open"] {
  .v-combobox-trigger__icon {
    transform: rotate(180deg);
    transition: all 0.3s;
  }
}
</style>
