<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: false,
  },
  contentStyleDefault: {
    type: Boolean,
    default: true,
  },
  horizontal: Boolean,
});
</script>

<template>
  <div
    class="VTimeline v-timeline"
    :class="{ 'is--content-style-default': contentStyleDefault && !horizontal, 'is--horizontal': horizontal }"
  >
    <slot name="title">
      <h3
        v-if="title"
        class="v-timeline__title"
      >
        {{ title }}
      </h3>
    </slot>
    <ul class="v-timeline__content">
      <slot />
    </ul>
  </div>
</template>

<style lang="scss">
.v-timeline{
  $root: &;

  position: relative;

  &__title{
    margin-bottom: 20px;
    color: var(--foreground);
  }

  &__content{
    width: 100%;
    position: relative;
    padding-left: 0;
  }

  &.is--content-style-default{
    #{$root}__content{
      max-width: 740px;
      margin: 0 auto;
    }
    #{$root}__title{
      max-width: 740px;
      margin: 0 auto 20px;
    }
  }

  &.is--horizontal{
    #{$root}__content{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 30px;

      @media screen and (width <= 980px){
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      @media screen and (width <= 768px){
        // grid-template-columns: repeat(1, minmax(0, 1fr));
        display: flex;
        flex-direction: column;
      }
    }
  }
}

:is(.dark, [data-theme='dark']) .v-timeline__title {
  color: var(--foreground);
}
</style>
