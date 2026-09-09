<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "../lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <th
    data-slot="table-head"
    :class="cn('text-table-head-foreground h-10 p-table-cell text-left align-middle text-table-head font-table-head whitespace-nowrap [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5', props.class)"
  >
    <slot />
  </th>
</template>
