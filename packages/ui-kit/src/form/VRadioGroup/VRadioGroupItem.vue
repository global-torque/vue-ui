<script setup lang="ts">
import {
  RadioGroupIndicator,
  RadioGroupItem,
  type RadioGroupItemProps,
  useForwardProps,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused; // Explicitly mark as intentionally unused

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RadioGroupItem
    v-bind="forwardedProps"

    class="VRadioGroupItem v-radio-group-item"
    :class="props.class"
  >
    <RadioGroupIndicator
      class="v-radio-group-item__circle"
    />
  </RadioGroupItem>
</template>

<style lang="scss">
.v-radio-group-item {
  &__circle {
    width: 8px;
    height: 8px;
    background-color: red;
  }
}
</style>
