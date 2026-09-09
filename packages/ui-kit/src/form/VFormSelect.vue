<script lang="ts" setup>
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@global-torque/ui-primitives/select';
import { Skeleton } from '@global-torque/ui-primitives/skeleton';
import { computed, useAttrs, watch } from 'vue';
import {
  getFormControlA11yAttrs,
  hasExplicitAttr,
  omitAttrs,
  useVFormFieldContext,
} from './formFieldContext';

defineOptions({
  inheritAttrs: false,
});

export type ObjectOptionValue = string | number;
type ObjectOption = Record<string, string | number | boolean | undefined> & {
  disabled?: boolean;
};
export type SelectOption = ObjectOption | string;

const props = withDefaults(defineProps<{
  options: SelectOption[];
  itemLabel?: string;
  itemValue?: string;
  size?: 'large' | 'medium' | 'small';
  contentPosition?: 'item-aligned' | 'popper';
  isError?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
  class?: string;
}>(), {
  itemLabel: 'label',
  itemValue: 'value',
  size: 'large',
  contentPosition: 'popper',
});

const modelValue = defineModel<ObjectOptionValue>();
const attrs = useAttrs();
const fieldContext = useVFormFieldContext();
const sizeClass = computed(() => ({ large: 'h-control-lg', medium: 'h-control-md', small: 'h-control-sm' }[props.size]));
const triggerSize = computed(() => ({ large: 'lg', medium: 'default', small: 'sm' } as const)[props.size]);

function isObjectOption(option: SelectOption): option is ObjectOption {
  return typeof option === 'object' && option !== null;
}

function getOptionValue(option: SelectOption): ObjectOptionValue {
  const value = isObjectOption(option) ? option[props.itemValue] : option;
  return typeof value === 'number' ? value : String(value ?? '');
}

function getOptionLabel(option: SelectOption): string {
  const value = isObjectOption(option) ? option[props.itemLabel] : option;
  return String(value ?? '');
}

// Helper function to find the label or value based on modelValue (case-insensitive)
const findValueInOption = (value: ObjectOptionValue) => {
  if (!value) return undefined;
  return props.options.find((option) => (
    String(getOptionValue(option)).toLowerCase() === value.toString().toLowerCase()
      || String(getOptionLabel(option)).toLowerCase() === value.toString().toLowerCase()
  ));
};

// Computed display value function
const displayValue = (value: ObjectOptionValue): ObjectOptionValue => {
  if (props.options.some(isObjectOption)) {
    const found = findValueInOption(value);
    return found ? getOptionValue(found) : value;
  }
  return value;
};

watch(() => [props.options.length, modelValue.value], () => {
  if (props.options.length > 0 && modelValue.value !== undefined) {
    modelValue.value = displayValue(modelValue.value);
  }
});

const selectRootAttrs = computed(() => {
  const rootAttrs: Record<string, unknown> = {};
  if (hasExplicitAttr(attrs, 'name')) rootAttrs.name = attrs.name;
  return rootAttrs;
});

const triggerAttrs = computed(() => ({
  ...omitAttrs(attrs, ['class', 'style', 'name']),
  ...getFormControlA11yAttrs(attrs, fieldContext, {
    invalid: props.isError,
    labelledBy: true,
  }),
}));
</script>

<template>
  <Skeleton
    v-if="loading"
    class="v-select-trigger w-full rounded-control"
    :class="sizeClass"
  />
  <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
  <Select
    v-else
    v-bind="selectRootAttrs"
    v-model="modelValue"
  >
    <SelectTrigger
      v-bind="triggerAttrs"
      :disabled="disabled || readonly"
      :size="triggerSize"
      :data-readonly="readonly || undefined"
      :data-disabled="disabled || undefined"
      class="v-form-select w-full"
      :class="[props.class, { 'bg-muted disabled:cursor-default disabled:opacity-100': readonly && !disabled }]"
    >
      <SelectValue :placeholder="placeholder" />
      <template
        v-if="$slots.icon"
        #icon
      >
        <slot name="icon" />
      </template>
    </SelectTrigger>
    <SelectContent :position="contentPosition">
      <SelectGroup>
        <SelectItem
          v-for="(item, index) in options"
          :key="String(getOptionValue(item)) + index"
          :value="getOptionValue(item)"
          :disabled="isObjectOption(item) ? item.disabled : undefined"
        >
          <slot
            name="item"
            :item="item"
          >
            {{ getOptionLabel(item) }}
          </slot>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<style>
.v-form-select {
  display: var(--ui-form-select-display, revert-layer);
  position: var(--ui-form-select-position, revert-layer);
  padding-block: var(--ui-form-select-padding-block, revert-layer);
  overflow: var(--ui-form-select-overflow, revert-layer);
}

.v-form-select:not(:focus-visible, [data-state='open'], [aria-invalid='true']) {
  border-color: var(--ui-form-select-border, var(--color-control-border, var(--input)));
}

.v-form-select [data-slot='select-value'] {
  flex: var(--ui-form-select-value-flex, revert-layer);
  min-width: var(--ui-form-select-value-min-width, revert-layer);
  text-align: var(--ui-form-select-value-align, revert-layer);
}

.v-form-select[data-readonly] {
  border-width: var(--ui-form-readonly-border-width, revert-layer);
  border-radius: var(--ui-form-readonly-radius, revert-layer);
  background-color: var(--ui-form-readonly-background, revert-layer);
  pointer-events: var(--ui-form-readonly-pointer-events, revert-layer);
}

.v-form-select[data-readonly] > svg {
  display: var(--ui-form-readonly-icon-display, revert-layer);
}

.v-form-select[data-disabled] {
  opacity: var(--ui-form-disabled-opacity, revert-layer);
}
</style>
