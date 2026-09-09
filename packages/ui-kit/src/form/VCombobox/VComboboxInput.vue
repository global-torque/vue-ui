<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { ComboboxInput, type ComboboxInputProps, useForwardProps } from 'reka-ui';

const props = defineProps<ComboboxInputProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ComboboxInput
    v-bind="forwardedProps"
    :class="props.class"
    class="VComboboxInput v-combobox-input"
  />
</template>

<style lang="scss">
.v-combobox-input {
  padding: 0;
    border: none;
    color: inherit;
    font-size: inherit;
    font-weight: inherit;
    font-family: inherit;
    line-height: inherit;
    background-color: transparent;
    width: 100%;
    position: relative;
    z-index: 2;
    height: 100%;

    &:focus {
      outline: none;
    }

    &::placeholder {
      opacity: 1;
      color: var(--muted-foreground);
      font-size: inherit;
      font-weight: inherit;
      font-family: inherit;
      line-height: inherit;
    }
}
</style>
