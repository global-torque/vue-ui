<script setup lang="ts">
import type { DialogTriggerProps } from 'reka-ui'
import { DialogTrigger } from 'reka-ui'

const props = defineProps<DialogTriggerProps>()
</script>

<template>
  <DialogTrigger
    data-slot="sheet-trigger"
    class="[&:enabled:not([aria-disabled=true]):not([data-disabled]):not([data-unavailable])]:cursor-pointer"
    v-bind="props"
  >
    <slot />
  </DialogTrigger>
</template>
