<script setup lang="ts">
import { ComboboxAnchor, type ComboboxAnchorProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = withDefaults(defineProps<ComboboxAnchorProps & {
  class?: HTMLAttributes['class'];
  size?: 'large' | 'medium';
  isError?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  focused?: boolean;
}>(), {
  size: 'large',
});

const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused; // Explicitly mark as intentionally unused

  return delegated;
});
</script>

<template>
  <ComboboxAnchor
    v-bind="delegatedProps"
    :class="[props.class, `is--size-${size}`, {
      'is--error': isError, 'is--focused': focused, 'is--readonly': readonly, 'is--disabled': disabled,
    }]"
    class="VComboboxAnchor v-combobox-anchor"
  >
    <slot />
  </ComboboxAnchor>
</template>

<style lang="scss" scoped>
.v-combobox-anchor {
  color: var(--foreground);
  caret-color: var(--foreground);
  background-color: transparent;
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  font-family: var(--font-sans);
  padding: 0 10px;
  margin: 0;
  appearance: none;
  width: 100%;
  position: relative;
  border: 1px solid var(--input);
  border-radius: var(--radius-md);
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;

  &.is--focused {
    border-color: var(--primary);
  }

  &.is--error {
    border-color: var(--destructive);
  }

  &.is--size-small {
    height: 32px;
  }

  &.is--readonly {
    border-radius: 0;
    border: none;
    pointer-events: none;
  }

  &.is--disabled {
    opacity: 0.3;
    pointer-events: none;
  }
}
</style>
