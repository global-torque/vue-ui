<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'reka-ui';
import {
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  shallowRef,
  watch,
} from 'vue';
import {
  ensureLocationChangeHistoryPatched,
  LOCATION_CHANGE_EVENT,
} from '../url-sync/locationChange';
import { Dialog } from '@global-torque/ui-primitives/dialog';

const props = defineProps<{
  open?: boolean;
  queryKey?: string;
  queryValue?: string;
} & /* @vue-ignore */ DialogRootProps>();
const emits = defineEmits</* @vue-ignore */ DialogRootEmits>();
const instance = getCurrentInstance();

const delegatedProps = computed(() => {
  const {
    open: unusedOpen,
    queryKey: unusedQueryKey,
    queryValue: unusedQueryValue,
    ...delegated
  } = props;
  void unusedOpen;
  void unusedQueryKey;
  void unusedQueryValue;
  return delegated;
});

const isClient = typeof window !== 'undefined';
const resolvedQueryKey = computed(() => props.queryKey || 'dialog');
const resolvedQueryValue = computed(() => props.queryValue ?? 'true');
const buildRelativeUrl = (url: URL) => `${url.pathname}${url.search}${url.hash}`;

const readOpenFromUrl = () => {
  if (!isClient) return false;

  return new URLSearchParams(window.location.search).get(resolvedQueryKey.value)
    === resolvedQueryValue.value;
};

const writeOpenToUrl = (isOpen: boolean) => {
  if (!isClient) return;

  const url = new URL(window.location.href);
  const currentValue = url.searchParams.get(resolvedQueryKey.value);

  if (isOpen) {
    if (currentValue === resolvedQueryValue.value) return;
    url.searchParams.set(resolvedQueryKey.value, resolvedQueryValue.value);
  } else {
    if (currentValue !== resolvedQueryValue.value) return;
    url.searchParams.delete(resolvedQueryKey.value);
  }

  window.history.replaceState(window.history.state, '', buildRelativeUrl(url));
};

const hasControlledOpen = () => {
  const vnodeProps = instance?.vnode.props;
  return vnodeProps != null && ('open' in vnodeProps || 'onUpdate:open' in vnodeProps);
};

const open = shallowRef(readOpenFromUrl() || (hasControlledOpen() && Boolean(props.open)));

const syncOpenFromUrl = () => {
  const nextOpen = readOpenFromUrl();
  if (open.value !== nextOpen) open.value = nextOpen;
};

const handleOpenChange = (nextOpen: boolean) => {
  if (open.value !== nextOpen) open.value = nextOpen;
};

watch(open, (nextOpen) => {
  emits('update:open', nextOpen);
  writeOpenToUrl(nextOpen);
}, { immediate: true });

watch(() => props.open, (nextOpen) => {
  if (hasControlledOpen() && typeof nextOpen === 'boolean' && open.value !== nextOpen) {
    open.value = nextOpen;
  }
});

watch([resolvedQueryKey, resolvedQueryValue], () => {
  if (open.value) writeOpenToUrl(true);
  else syncOpenFromUrl();
});

onMounted(() => {
  if (!isClient) return;

  syncOpenFromUrl();
  ensureLocationChangeHistoryPatched();
  window.addEventListener('popstate', syncOpenFromUrl);
  window.addEventListener(LOCATION_CHANGE_EVENT, syncOpenFromUrl);
});

onUnmounted(() => {
  if (!isClient) return;

  window.removeEventListener('popstate', syncOpenFromUrl);
  window.removeEventListener(LOCATION_CHANGE_EVENT, syncOpenFromUrl);
});
</script>

<template>
  <Dialog
    v-bind="delegatedProps"
    :open="open"
    @update:open="handleOpenChange"
  >
    <slot />
  </Dialog>
</template>
