<script setup lang="ts">
import type { TabsListProps } from "reka-ui"
import { computed, type HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsList } from "reka-ui"
import { cn } from "../lib/utils"
import { useTabsVariant } from "./variant"

const props = defineProps<TabsListProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
const injectedVariant = useTabsVariant()
const variant = computed(() => injectedVariant?.value)
</script>

<template>
  <TabsList
    data-slot="tabs-list"
    :data-variant="variant"
    v-bind="delegatedProps"
    :class="cn(
      'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center overflow-x-auto overflow-y-hidden rounded-lg p-0.75 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      variant === 'line' && 'relative h-12 w-full items-stretch justify-start gap-5 rounded-none bg-transparent p-0 shadow-[inset_0_-2px_0_0_var(--input)]',
      props.class,
    )"
  >
    <slot />
  </TabsList>
</template>
