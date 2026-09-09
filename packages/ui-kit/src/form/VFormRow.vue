<script setup lang="ts">
</script>

<template>
  <div class="FormRow form-row">
    <slot />
  </div>
</template>

<style lang="scss">
@use '../styles/mixins.scss' as *;

.form-row {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  @include media-lte(tablet) {
    flex-direction: column;
  }
}
</style>
