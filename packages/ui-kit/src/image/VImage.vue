<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, watch } from 'vue';
import { Skeleton } from '@global-torque/ui-primitives/skeleton';
import defaultImage from './image-unavailable.svg?url';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  src?: string;
  srcset?: string;
  sizes?: string;
  alt: string;
  fallbackSrc?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down' | 'inherit';
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchpriority?: 'high' | 'low' | 'auto';
  isLoading?: boolean;
}>(), { loading: 'eager', decoding: 'async', fit: 'inherit' });

const emit = defineEmits<{
  'loading:src': [loading: boolean];
  load: [event: Event];
  error: [event: Event];
}>();

const attrs = useAttrs();
const imageElement = ref<HTMLImageElement>();
const failed = ref(false);
const pending = ref(Boolean(props.src));
const fallback = computed(() => !props.src || failed.value);
const source = computed(() => fallback.value ? props.fallbackSrc || defaultImage : props.src);
const busy = computed(() => Boolean(props.isLoading) || pending.value);
// Replacing the element also isolates late events from a previous source.
const imageKey = computed(() => JSON.stringify([source.value, props.srcset, props.sizes]));

function imageAttrs() {
  const forwarded = { ...attrs };
  delete forwarded.class;
  delete forwarded.style;
  return forwarded;
}

function loaded(event: Event) {
  if (event.target !== imageElement.value) return;
  pending.value = false;
  emit('load', event);
}

function errored(event: Event) {
  if (event.target !== imageElement.value) return;
  pending.value = false;
  failed.value = true;
  emit('error', event);
}

function checkCached() {
  const image = imageElement.value;
  if (!pending.value || !image?.complete) return;
  if (image.naturalWidth > 0) pending.value = false;
  else if (props.loading !== 'lazy') {
    pending.value = false;
    failed.value = true;
  }
}

watch(busy, value => emit('loading:src', value), { immediate: true });
watch(() => [props.src, props.srcset, props.sizes], async () => {
  failed.value = false;
  pending.value = Boolean(props.src);
  await nextTick();
  checkCached();
});
onMounted(checkCached);
</script>

<template>
  <span
    class="v-image"
    :class="$attrs.class"
    :style="$attrs.style"
    :aria-busy="busy"
    :data-fallback="fallback"
  >
    <Skeleton
      v-if="busy"
      class="v-image__skeleton"
      aria-hidden="true"
    />
    <img
      v-bind="imageAttrs()"
      :key="imageKey"
      ref="imageElement"
      :src="source"
      :srcset="fallback ? undefined : srcset"
      :sizes="fallback ? undefined : sizes"
      :alt="alt"
      :loading="loading"
      :decoding="decoding"
      :fetchpriority="fetchpriority"
      class="v-image__image"
      :class="{ 'is--loading': busy, 'is--default-image': fallback }"
      :style="{ objectFit: fallback ? 'contain' : fit }"
      @load="loaded"
      @error="errored"
    >
  </span>
</template>

<style scoped>
.v-image {
  position: relative;
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
  vertical-align: middle;
}

.v-image__image {
  display: block;
  margin: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  min-height: 0;
  border-radius: inherit;
  object-position: inherit;
}

.v-image__image.is--loading { opacity: 0; }
.v-image__skeleton { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
</style>
