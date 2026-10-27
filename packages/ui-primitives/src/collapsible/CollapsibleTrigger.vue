<script setup lang="ts">
import type { CollapsibleTriggerProps } from 'reka-ui'
import { CollapsibleTrigger } from 'reka-ui'

const props = defineProps<CollapsibleTriggerProps>()
</script>

<template>
  <CollapsibleTrigger
    data-slot="collapsible-trigger"
    class="[&:enabled:not([aria-disabled=true]):not([data-disabled]):not([data-unavailable])]:cursor-pointer"
    v-bind="props"
  >
    <slot />
  </CollapsibleTrigger>
</template>
