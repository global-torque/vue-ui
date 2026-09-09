<script setup lang="ts">
import type { TabsContentProps } from "reka-ui"
import { computed, type HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsContent } from "reka-ui"
import { cn } from "../lib/utils"
import { useTabsVariant } from "./variant"

const props = defineProps<TabsContentProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
const injectedVariant = useTabsVariant()
const variant = computed(() => injectedVariant?.value)
</script>

<template>
  <TabsContent
    data-slot="tabs-content"
    :data-variant="variant"
    :class="cn('flex-1 outline-none', variant === 'line' && 'pt-10', props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </TabsContent>
</template>
