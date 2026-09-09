<script setup lang="ts">
import { computed } from 'vue';
import check from './assets/check.svg?url';

interface Props {
  type?: 'active' | 'inner' | 'not-complete' | 'complete' | 'highlight' | 'inner-highlight';
}

const props = withDefaults(defineProps<Props>(), {
  type: 'active',
});

const btnClasses = computed(() => {
  const classes = `is--type-${props.type} `;
  return classes;
});
</script>

<template>
  <div
    class="VTimelineCircle v-timeline-circle"
    :class="[btnClasses]"
  >
    <img
      v-if="type === 'complete'"
      :src="check"
      alt="check icon"
      class="v-timeline-circle__icon "
    >
  </div>
</template>

<style lang="scss">
.v-timeline-circle{
  $root: &;

  display: flex;
  justify-content: center;
  align-items: center;
  border-style: solid;
  gap: 10px;
  border-radius: 100%;
  z-index: 2;

  &.is--type-inner{
    width: 9px;
    height: 9px;
    border-width: 3px;
    border-color: var(--primary);
  }

  &.is--type-inner-highlight{
    width: 9px;
    height: 9px;
    border-width: 3px;
    border-color: var(--background);
  }

  &.is--type-active{
    width: 24px;
    height: 24px;
    border-width: 5px;
    border-color: var(--primary);
  }

  &.is--type-not-complete{
    width: 24px;
    height: 24px;
    border-width: 5px;
    border-color: var(--input);
  }

  &.is--type-complete{
    width: 24px;
    height: 24px;
    border-color: var(--primary);
    background-color: var(--primary);
  }

  &.is--type-highlight {
    width: 24px;
    height: 24px;
    border-width: 5px;
    border-color: var(--primary);

    &::before{
      content: '';
      width: 40px;
      height: 40px;
      border: 1px solid var(--primary);
      position: absolute;
      border-radius: 100%;
    }
  }
}
</style>
