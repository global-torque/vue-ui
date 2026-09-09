<script lang="ts" setup>
</script>

<template>
  <div class="VInputOtpGroup v-input-otp-group">
    <slot />
  </div>
</template>

<style lang="scss">
.v-input-otp-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;

  &:first-of-type {
    justify-content: end;
  }
}
</style>
