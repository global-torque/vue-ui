<script setup lang="ts">
import {
  SelectItem,
  type SelectItemProps,
  SelectItemText,
  useForwardProps,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<{ class?: HTMLAttributes['class']; disabled?: boolean } & /* @vue-ignore */ SelectItemProps>();

const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused; // Explicitly mark as intentionally unused

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectItem
    v-bind="forwardedProps"
    :class="[props.class, { 'is--disabled': disabled }]"
    class="VSelectItem v-select-item"
  >
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>

<style lang="scss">
.v-select-item {
  font-family: var(--font-sans);
    color: var(--foreground);
    padding: 12px;
    cursor: pointer;
    font-size: 16px;
    line-height: 26px;
}

.v-select-item[data-disabled] {
  pointer-events: none;

  &:not(.is--disabled-slot) {
    opacity: 0.3;
  }
}

.v-select-item[data-highlighted] {
  outline: none;
  background-color: var(--border);
}
</style>
