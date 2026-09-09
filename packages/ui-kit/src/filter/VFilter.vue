<script setup lang="ts">
import { Button } from '@global-torque/ui-primitives/button';
import VFormCheckboxGroup from '../form/VFormCheckboxGroup.vue';
import {
  computed,
  ref,
  watch,
} from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useSyncFilterItemsWithUrl } from '../url-sync/useSyncFilterItemsWithUrl';
import type {
  UseSyncWithUrlAdapter,
  UseSyncWithUrlNavigationMode,
  UseSyncWithUrlRouteLike,
  UseSyncWithUrlRouterLike,
} from '../url-sync/useSyncWithUrl';

export interface IVFilter {
  value: string;
  title: string;
  options: string[];
  model: string[];
  [key: string]: unknown;
}

interface VFilterProps {
  items: IVFilter[];
  disabled?: boolean;
  filtersToUrl?: boolean;
  queryKey?: string;
  urlSyncAdapter?: UseSyncWithUrlAdapter;
  urlSyncNavigationMode?: UseSyncWithUrlNavigationMode;
  route?: UseSyncWithUrlRouteLike | null;
  router?: UseSyncWithUrlRouterLike | null;
}

const props = withDefaults(defineProps<VFilterProps>(), {
  disabled: false,
  filtersToUrl: false,
  queryKey: 'filter',
  urlSyncAdapter: 'auto',
  urlSyncNavigationMode: 'replace',
});

const emit = defineEmits<{
  apply: [items: IVFilter[]];
}>();

defineSlots<{ icon?: () => unknown }>();

const showDropdown = ref(false);
const target = ref<HTMLElement | null>(null);
const draftItems = ref<IVFilter[]>([]);

const {
  cloneItems,
  items: appliedItems,
  setItems: setAppliedItems,
} = useSyncFilterItemsWithUrl<IVFilter>({
  items: () => props.items,
  syncToUrl: () => props.filtersToUrl,
  queryKey: () => props.queryKey,
  adapter: () => props.urlSyncAdapter,
  navigationMode: () => props.urlSyncNavigationMode,
  route: () => props.route,
  router: () => props.router,
  onSyncFromUrl: (items) => {
    emit('apply', items);
  },
});

const selectedFilters = computed(() => appliedItems.value.reduce(
  (count, item) => count + item.model.length,
  0,
));

const onFilterButtonClick = () => {
  if (props.disabled) {
    return;
  }

  if (showDropdown.value) {
    close();
    return;
  }

  draftItems.value = cloneItems(appliedItems.value);
  showDropdown.value = true;
};

const close = () => {
  draftItems.value = cloneItems(appliedItems.value);
  showDropdown.value = false;
};

const scrollToFilterButton = () => {
  if (target.value) {
    target.value.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }
};

const emitApply = (items: IVFilter[]) => {
  const nextItems = cloneItems(items);

  setAppliedItems(nextItems);
  emit('apply', cloneItems(nextItems));
};

const onApplyClick = () => {
  emitApply(draftItems.value);
  close();
  scrollToFilterButton();
};

const onClear = () => {
  draftItems.value = draftItems.value.map((item) => ({
    ...item,
    options: [...item.options],
    model: [],
  }));
};

const onClearClick = () => {
  onClear();
  emitApply(draftItems.value);
  close();
  scrollToFilterButton();
};

onClickOutside(target, () => close());

watch(() => props.disabled, (disabled) => {
  if (disabled && showDropdown.value) {
    close();
  }
});

watch(appliedItems, (items) => {
  draftItems.value = cloneItems(items);
}, { immediate: true });
</script>

<template>
  <div
    ref="target"
    class="VFilter v-filter"
    :class="{ 'is--disabled': disabled }"
  >
    <Button
      :disabled="disabled"
      class="v-filter__button"
      variant="link"
      size="sm"
      @click="onFilterButtonClick"
    >
      <slot name="icon">
        <svg
          class="v-filter__button-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6.5 11V8.75L2 3.5V2H14V3.5L9.5 8.75V13.25L6.5 11Z"
            fill="currentColor"
          />
        </svg>
      </slot>
      Filters&nbsp;
      <span
        v-if="selectedFilters && selectedFilters > 0"
        class="v-filter__button-number"
      >
        ({{ selectedFilters }})
      </span>
    </Button>
    <Transition>
      <div
        v-if="showDropdown"
        class="v-filter__dropdown"
      >
        <div
          v-for="item in draftItems"
          :key="item.value"
          class="v-filter__group"
        >
          <div class="v-filter__title is--h6__title">
            {{ item.title }}
          </div>
          <VFormCheckboxGroup
            v-model="item.model"
            :options="item.options"
            class="v-filter__checkbox-group"
          />
        </div>

        <div class="v-filter__cta">
          <Button
            class="v-filter__button is--margin-top-0 w-full"
            size="sm"
            @click="onApplyClick"
          >
            Apply
          </Button>
          <Button
            class="v-filter__button is--margin-top-0 w-full"
            variant="link"
            size="sm"
            @click.stop="onClearClick"
          >
            Clear Selected
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss">
.v-filter{
  --v-filter-dropdown-min-width: 150px;
  --v-form-checkbox-group-item--padding: 12px;

  position: relative;

  &__button-icon{
    color: inherit;
    width: 16px;
  }

  &__dropdown{
    position: absolute;
    top: 100%;
    left: 0;
    min-width: var(--v-filter-dropdown-min-width);
    width: fit-content;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background-color: var(--ui-color-canvas, var(--muted));
    border: 1px solid var(--ui-color-border-subtle, var(--border));
    box-shadow: var(--ui-shadow-dialog, 0 4px 5px -2px rgb(18 22 31 / 5%), 0 6px 25px 2px rgb(18 22 31 / 6%));
    z-index: 2;
  }

  &__cta{
    display: flex;
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    align-self: stretch;
  }

  &__title{
    color: var(--ui-color-text-muted, #495057);
    padding: 12px 12px 2px;
    text-transform: capitalize;
  }

  &__group{
    width: 100%;
  }

  &__checkbox-group{
    width: 100%;

    .v-form-checkbox{
      .is--checked{
        color: var(--primary);
        font-weight: 600;
      }
    }
  }
}
</style>
