<script setup lang="ts">
import type { TabsRootEmits, TabsRootProps } from 'reka-ui';
import {
  computed,
  type HTMLAttributes,
  onUnmounted,
  watch,
} from 'vue';
import { useSyncWithUrl } from '../url-sync/useSyncWithUrl';
import { Tabs, type TabsVariant } from '@global-torque/ui-primitives/tabs';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  queryKey?: string;
  modelValue?: string;
  defaultValue?: string;
  variant?: TabsVariant;
} & /* @vue-ignore */ TabsRootProps>();
const emits = defineEmits</* @vue-ignore */ TabsRootEmits>();

const delegatedProps = computed(() => {
  const {
    modelValue: unusedModelValue,
    queryKey: unusedQueryKey,
    ...delegated
  } = props;
  void unusedModelValue;
  void unusedQueryKey;
  return delegated;
});

const queryKey = props.queryKey || 'tab';
const selectedTab = useSyncWithUrl({
  key: queryKey,
  defaultValue: props.defaultValue || '',
  syncToUrl: true,
});
let shouldSkipInitialModelSync = Boolean(
  typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has(queryKey),
);

watch(selectedTab, (newValue) => {
  emits('update:modelValue', newValue);
}, { immediate: true });

watch(() => props.modelValue, (newValue) => {
  if (shouldSkipInitialModelSync) {
    shouldSkipInitialModelSync = false;
    return;
  }

  if (newValue !== undefined && newValue !== selectedTab.value) {
    selectedTab.value = newValue;
  }
}, { immediate: true });

onUnmounted(() => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has(queryKey)) return;

  url.searchParams.delete(queryKey);
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
});
</script>

<template>
  <Tabs
    v-bind="delegatedProps"
    v-model="selectedTab"
  >
    <slot />
  </Tabs>
</template>
