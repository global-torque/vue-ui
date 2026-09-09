<script setup lang="ts">
import { computed } from 'vue';
import VTimelineCircle from './VTimelineCircle.vue';

interface Props {
  type?: 'active' | 'complete' | 'not-complete' | 'inner' | 'inner-highlight';
  variant?: 'primary' | 'inner' | 'highlight' | 'inner-highlight';
  title?: string;
  duration?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'active',
  variant: 'primary',
});

const btnClasses = computed(() => {
  let classes = `is--type-${props.type} `;
  classes += `is--variant-${props.variant} `;
  return classes;
});
</script>

<template>
  <div
    class="VTimelineCard v-timeline-card is--card is--body"
    :class="[btnClasses]"
  >
    <div
      v-if="title"
      class="v-timeline-card__header"
    >
      <VTimelineCircle
        v-if="(variant === 'inner') || (variant === 'inner-highlight')"
        :type="(variant === 'inner') ? 'inner' : 'inner-highlight'"
        class="v-timeline-card__circle"
      />

      <h4 class="v-timeline-card__title">
        {{ title }}
      </h4>

      <div
        v-if="duration"
        class="v-timeline-card__duration"
      >
        <span class="v-timeline-card__duration-title is--small">
          Duration:
          <span class="v-timeline-card__duration-text is--h6__title">
            {{ duration }}
          </span>
        </span>
      </div>
    </div>
    <slot />
  </div>
</template>

<style lang="scss">
.v-timeline-card{
  $root: &;

  flex-direction: column;
  padding: 40px !important;
  position: relative;
  color: var(--ui-color-text-secondary, #343A40);

  &__duration-title{
    color: var(--foreground);
  }

  &__duration-text{
    color: var(--primary);
  }

  &__circle{
    position: absolute;
    left: 16px;
    top: 50px;

    @media screen and (width <= 767px){
      left: 10px;
    }
  }

  &__header{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 15px;
    border-bottom: 1px dashed var(--ui-timeline-border, rgb(51 51 51 / 10%));

    @media screen and (width <= 767px){
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
    }
  }

  &__title{
    margin-top: 0;
    color: var(--foreground);

    @media screen and (width <= 767px){
      margin-bottom: 10px;
    }
  }

  &.is--variant-inner{
    margin-bottom: 32px;
    color: var(--ui-color-text-secondary, #343A40);

    &::before {// inner lines between cards
      content: "";
      position: absolute;
      left: 20px;
      bottom: -32px;
      width: 2px;
      height: 32px;
      background-color: var(--input);

      @media screen and (width <= 767px){
        left: 15px;
      }
    }

    &:last-child{
      margin-bottom: 0;

      &::before{
        display: none;
      }
    }
  }

  &.is--variant-inner-highlight{
    background-color: #0042D4;
    color: var(--muted);

    &::before {// inner lines between cards
      content: "";
      position: absolute;
      left: 20px;
      bottom: -32px;
      width: 2px;
      height: 32px;
      background-color: var(--input);

      @media screen and (width <= 767px){
        left: 15px;
      }
    }

    #{$root}__title{
      color: var(--ui-color-text-inverse, #fff);
    }

    p{
      color: var(--ui-color-text-inverse, #fff);
    }

    #{$root}__duration-title,
    #{$root}__duration-text{
      color: var(--ui-color-text-inverse, #fff);
    }

    #{$root}__header{
      border-color: var(--background);
    }

    &:last-child{
      margin-bottom: 0;

      &::before{
        display: none;
      }
    }
  }

  &.is--variant-highlight{
    background-color: #0042D4;
    color: var(--muted);

    #{$root}__title{
      color: var(--muted);
    }

    p{
      color: var(--ui-color-text-inverse, #fff);
    }

    #{$root}__duration-title,
    #{$root}__duration-text{
      color: var(--ui-color-text-inverse, #fff);
    }

    #{$root}__header{
      border-color: var(--background);
    }
  }

  &.is--type-not-complete{
    opacity: 0.3;
    pointer-events: none;
  }

  &.is--type-complete{
    background-color: var(--muted);
    border: 1px solid var(--border);
    box-shadow: 0 2px 5px 1px rgb(18 22 31 / 3%), 0 2px 3px -2px rgb(18 22 31 / 15%);
  }
}
</style>
