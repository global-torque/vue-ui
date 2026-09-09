<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  col2?: boolean;
  col3?: boolean;
}>();

const classes = computed(() => ({
  'f-col-2': props.col2,
  'f-col-3': props.col3,
}));
</script>

<template>
  <div
    class="FormCol form-col"
    :class="classes"
  >
    <slot />
  </div>
</template>

<style lang="scss">
@use '../styles/mixins.scss' as *;

.form-col {
  width: 100%;
  margin-bottom: 20px;

  &.f-col-2 {
    width: calc(50% - 10px);

    @include media-lte(tablet) {
      width: 100%;
    }
  }

  &.f-col-3 {
    width: calc(33.3333% - 10px);

    @include media-lte(tablet) {
      width: 100%;
    }
  }
}

</style>
