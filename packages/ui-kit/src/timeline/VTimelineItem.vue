<script setup lang="ts">
import { computed } from 'vue';
import VTimelineCircle from './VTimelineCircle.vue';

interface Props {
  type?: 'active' | 'complete' | 'not-complete';
  variant?: 'primary' | 'inner' | 'highlight';
  circleType?: 'active' | 'not-complete' | 'complete' | 'highlight';
  line?: 'regular' | 'hidden';
  title?: string;
  duration?: string;
  active?: boolean;
  to?: [boolean, object];
  horizontal?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'active',
  variant: 'primary',
  circleType: 'active',
  line: 'regular',
});

const btnClasses = computed(() => {
  let classes = `is--type-${props.type} `;
  classes += `is--variant-${props.variant} `;
  classes += `is--circle-type-${props.circleType} `;
  classes += `is--line-${props.line} `;
  return classes;
});
</script>

<template>
  <li
    class="VTimelineItem v-timeline-item"
    :class="[btnClasses, { 'is--title': title, 'is--horizontal': horizontal }]"
  >
    <VTimelineCircle
      :type="circleType"
      class="v-timeline-item__circle"
    />

    <div
      v-if="title"
      class="v-timeline-item__step-wrap"
    >
      <component
        :is="to ? 'router-link' : 'h6'"
        :to="to"
        class="v-timeline-item__step is--h6__title"
      >
        {{ title }}
      </component>
    </div>

    <div
      v-if="$slots.default"
      class="items v-timeline-item__items"
    >
      <slot />
    </div>
  </li>
</template>

<style lang="scss">
@use '../styles/mixins.scss' as *;

.v-timeline-item {
  --top: 42px;
  --normal-circle-height: 24px;
  --highlight-circle-bigger: 8px;
  --highlight-circle-height: calc(var(--normal-circle-height) + var(--highlight-circle-bigger));

  $root: &;

  list-style: none;

  &:not(.is--horizontal) {
    #{$root}__items {
      margin-left: 50px;
    }
    #{$root}__circle {
      top: var(--top);
      position: absolute;
    }

    &::before {
      content: "";
      position: absolute;
      top: calc(var(--top) + var(--normal-circle-height));
      left: 11px;
      z-index: 1;
      width: 2px;
      height: calc(100% - var(--top) - var(--normal-circle-height) - (2 * var(--highlight-circle-bigger)));
      background-color: var(--input);
    }

    &::after {
      content: "";
      position: absolute;
      top: -16px; // -(2 * var(--highlight-circle-bigger))
      left: 11px;
      z-index: 1;
      width: 2px;
      height: calc(var(--top) + (2 * var(--highlight-circle-bigger)));
      background-color: var(--input);
    }

    &.is--title.is--circle-type-highlight{
      &::before {
        top: var(--highlight-circle-height);
        height: calc(100% - var(--highlight-circle-height));
      }

      &::after {
        height: var(--highlight-circle-bigger);
      }
    }
    #{$root}__step-wrap {
      margin-left: 50px;
    }
  }

  padding-bottom: 30px;
  position: relative;
  left: 0;
  top: 0;
  height: 100%;

  @media screen and (width <= 767px) {
    padding-bottom: 35px;
    margin-left: 8px;
  }

  &.is--line-regular:last-child {
    &::before{
      display: none;
    }
  }

  &.is--line-hidden {
    &::before{
      background: linear-gradient(var(--input), rgb(from var(--input) r g b / 0%)) !important;
    }
  }

  &:first-of-type{
    &::after {
      display: none;
    }
  }

  &__step-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    margin-bottom: 16px;
  }

  &__step {
    text-transform: uppercase;
    color: var(--primary);
  }

  &.is--circle-type-highlight {
    &::before {
      top: calc(var(--top) + var(--highlight-circle-height));
      height: calc(100% - var(--top) - var(--highlight-circle-height) - var(--highlight-circle-bigger));
    }

    &::after {
      height: calc(var(--top) + var(--highlight-circle-bigger));
    }
  }

  &.is--title {
    &::before {
      top: var(--normal-circle-height);
      height: calc(100% - var(--normal-circle-height) - var(--highlight-circle-bigger));
    }

    &::after {
      height: calc(2 * var(--highlight-circle-bigger));
    }
    #{$root}__circle {
      top: 0;
    }
  }

  &.is--horizontal {
    position: relative;
    display: flex;
    flex-direction: column;
    margin-bottom: 40px;

    @include media-lte(tablet) {
      padding-left: 60px;
      margin-bottom: 0;
    }

    #{$root}__circle {
      flex-shrink: 0;
      position: relative;
      margin-bottom: 12px;
      left: 50%;
      transform: translateX(-50%);

      @include media-lte(tablet) {
        top: 0;
        left: 9px;
        transform: translateX(0);
        position: absolute;
      }
    }

    &::before {
      content: "";
      position: absolute;
      top: 11px;
      left: calc(50% + 12px);
      z-index: 1;
      width: calc(100% + 7px);
      height: 2px;
      background-color: var(--input);

      @include media-lte(tablet) {
        top: 24px;
        left: 20px;
        width: 2px;
        height: calc(100% + 7px);
      }
    }

    &:nth-child(1)::before {
      @include media-gt(tablet) {
        left: calc(50% + 19px);
        width: calc(100%);
      }

      @include media-lte(tablet) {
        top: 32px;
        height: calc(100%);
      }
    }

    &:nth-child(3)::after {
      @include media-lte(desktop) {
        width: calc(100% + 100vw);
        content: "";
        position: absolute;
        top: 11px;
        right: calc(50% + 12px);
        z-index: 1;
        height: 2px;
        background-color: var(--input);

        @include media-lte(tablet) {
          display: none;
        }
      }
    }

    &:nth-child(3)::before {
      @include media-gt(desktop) {
        width: calc(100% + 100vw);
      }
    }

    &:nth-child(4)::after {
      @include media-gt(tablet) {
        content: "";
        position: absolute;
        top: 11px;
        right: calc(50% + 12px);
        z-index: 1;
        height: 2px;
        background-color: var(--input);
      }

      @include media-gte(desktop) {
        width: calc(100% + 100vw);
      }
    }

    &:nth-child(5)::after {
      @include media-lte(desktop) {
        width: calc(100% + 100vw);
        content: "";
        position: absolute;
        top: 11px;
        right: calc(50% + 12px);
        z-index: 1;
        height: 2px;
        background-color: var(--input);
      }

      @include media-lte(tablet) {
        display: none;
      }
    }
    #{$root}__step-wrap {
      margin-top: 20px;

      @include media-lte(tablet) {
        margin-top: 0;
      }

      @include media-gt(tablet) {
        justify-content: center;
      }
    }
  }
}

:is(.dark, [data-theme='dark']) .v-timeline-item__step {
  color: var(--foreground);
}

:is(.dark, [data-theme='dark']) .v-timeline-item__items {
  color: var(--muted-foreground);
}
</style>
