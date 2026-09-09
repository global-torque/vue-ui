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

<style lang="scss">
.v-combobox-anchor {
  color: var(--foreground);
  caret-color: var(--foreground);
  background-color: var(--ui-color-canvas, var(--muted));
  font-size: 16px;
  line-height: 26px;
  font-weight: 400;
  font-family: var(--font-sans);
  padding: 0 12px;
  margin: 0;
  appearance: none;
  width: 100%;
  position: relative;
  border: solid 1px var(--ui-color-border, #CED4DA);
  border-radius: 2px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;

  &.is--focused {
    border-color: var(--primary);
  }

  &.is--error {
    border-color: var(--ui-color-negative, #FF7070);
  }

  &.is--size-large {
    height: 48px;
    font-size: 16px;
    line-height: 26px;
  }

  &.is--size-small {
    height: 32px;
    font-size: 16px;
    line-height: 26px;
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
