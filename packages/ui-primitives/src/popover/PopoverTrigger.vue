<script setup lang="ts">
import type { PopoverTriggerProps } from 'reka-ui'
import { PopoverTrigger } from 'reka-ui'

const props = defineProps<PopoverTriggerProps>()
</script>

<template>
  <PopoverTrigger
    data-slot="popover-trigger"
    class="[&:enabled:not([aria-disabled=true]):not([data-disabled]):not([data-unavailable])]:cursor-pointer"
    v-bind="props"
  >
    <slot />
  </PopoverTrigger>
</template>
