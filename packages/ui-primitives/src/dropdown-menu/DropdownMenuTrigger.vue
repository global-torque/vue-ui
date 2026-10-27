<script setup lang="ts">
import type { DropdownMenuTriggerProps } from 'reka-ui'
import { DropdownMenuTrigger, useForwardProps } from 'reka-ui'

const props = defineProps<DropdownMenuTriggerProps>()

const forwardedProps = useForwardProps(props)
</script>

<template>
  <DropdownMenuTrigger
    data-slot="dropdown-menu-trigger"
    class="[&:enabled:not([aria-disabled=true]):not([data-disabled]):not([data-unavailable])]:cursor-pointer"
    v-bind="forwardedProps"
  >
    <slot />
  </DropdownMenuTrigger>
</template>
