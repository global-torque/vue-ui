<script setup lang="ts">
import { SelectGroup, type SelectGroupProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<{ class?: HTMLAttributes['class'] } & /* @vue-ignore */ SelectGroupProps>();

const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused; // Explicitly mark as intentionally unused

  return delegated;
});
</script>

<template>
  <SelectGroup
    :class="props.class"
    v-bind="delegatedProps"
    class="VSelectGroup v-select-group"
  >
    <slot />
  </SelectGroup>
</template>

<style lang="scss">
.v-select-group {
  width: 100%;
}
</style>
