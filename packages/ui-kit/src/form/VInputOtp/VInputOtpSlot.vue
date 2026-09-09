<script lang="ts" setup>
import type { SlotProps } from 'vue-input-otp';

defineProps<SlotProps>();
</script>

<template>
  <div
    class="VInputOtpSlot v-input-otp-slot"
    :class="{ 'is--active': isActive, 'is--filled': char !== null }"
  >
    <span v-if="char !== null">{{ char }}</span>
    <span
      v-else-if="hasFakeCaret"
      class="v-input-otp-slot__caret"
    />
  </div>
</template>

<style lang="scss">
.v-input-otp-slot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 1 48px;
  min-width: 0;
  aspect-ratio: 1;
  background-color: var(--muted);
  border: 1px solid #CED4DA;
  border-radius: 2px;
  font-size: 20px;
  font-weight: 600;
  font-family: var(--font-sans);
  color: var(--foreground);
  transition: border-color 0.15s ease;

  &.is--active {
    border-color: var(--primary);
    outline: none;
  }

  &__caret {
    display: block;
    width: 1px;
    height: 20px;
    background-color: var(--ui-color-surface-inverse, #12161f);
    animation: v-otp-caret-blink 1s step-start infinite;
  }
}

@keyframes v-otp-caret-blink {
  0%, 100% { opacity: 1; }

  50% { opacity: 0; }
}
</style>
