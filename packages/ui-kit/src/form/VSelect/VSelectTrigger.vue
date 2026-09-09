<script setup lang="ts">
import { ChevronDown as ChevronDown } from '@lucide/vue';
import {
  SelectIcon, SelectTrigger, type SelectTriggerProps, useForwardProps,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class'];
  size?: 'large' | 'medium';
} & /* @vue-ignore */ SelectTriggerProps>(), {
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
  <SelectTrigger
    v-bind="forwardedProps"
    :class="[props.class, `is--size-${size}`]"
    class="VSelectTrigger v-select-trigger"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="v-select-trigger__icon" />
    </SelectIcon>
  </SelectTrigger>
</template>

<style lang="scss">
.v-select-trigger {
  $root: &;

  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  overflow: hidden;
  font-size: 16px;
  font-family: var(--font-sans);
  font-weight: 400;
  background: var(--muted);
  position: relative;
  border: solid 1px #ADB5BD;
  border-radius: 2px;
  height: 40px;
  padding: 12.5px 12px;
  transition: all 0.3s ease;

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

  &.is--error {
    border-color: #FF7070;
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

  .v-select-value {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
  }

  &__icon {
    width: 14px;
    flex-shrink: 0;
    color: #495057;
    transition: all 0.3s;
    transform-origin: center;
    transform: rotate(0);
    margin-left: 9px;
    margin-top: 0 !important;

    #{$root}.is--readonly & {
      display: none;
    }
  }
}

.v-select-trigger[data-state="open"]{
  border-color: var(--primary);
  outline: none;

  .v-select-trigger__icon {
    transform: rotate(180deg);
    transition: all 0.3s;
  }
}

.v-select-trigger[data-placeholder] {
  opacity: 1;
  color: var(--muted-foreground);
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  line-height: inherit;
  text-align: inherit;
}
</style>
