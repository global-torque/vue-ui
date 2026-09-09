<script lang="ts" setup>
import { computed, ref, useAttrs } from 'vue';
import {
  VCombobox, VComboboxAnchor, VComboboxTrigger, VComboboxInput,
  VComboboxContent, VComboboxEmpty, VComboboxGroup, VComboboxItem,
} from './VCombobox';
import { Skeleton } from '@global-torque/ui-primitives/skeleton';
import {
  getFormControlA11yAttrs,
  omitAttrs,
  useVFormFieldContext,
} from './formFieldContext';

defineOptions({
  inheritAttrs: false,
});

type ObjectOptionValue = string | number;
type ObjectOption = Record<string, string | number | boolean | undefined>;
type ComboboxOption = ObjectOption | string;

const props = withDefaults(defineProps<{
  options: ComboboxOption[];
  itemLabel?: string;
  itemValue?: string;
  size?: 'large' | 'medium';
  isError?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  loading?: boolean;
}>(), {
  itemLabel: 'label',
  itemValue: 'value',
  size: 'large',
});

const modelValue = defineModel<ObjectOptionValue>();
const focus = ref(false);
const searchTerm = ref('');
const attrs = useAttrs();
const fieldContext = useVFormFieldContext();

function isObjectOption(option: ComboboxOption): option is ObjectOption {
  return typeof option === 'object' && option !== null;
}

function getOptionValue(option: ComboboxOption): ObjectOptionValue {
  const value = isObjectOption(option) ? option[props.itemValue] : option;
  return typeof value === 'number' ? value : String(value ?? '');
}

function getOptionLabel(option: ComboboxOption): string {
  const value = isObjectOption(option) ? option[props.itemLabel] : option;
  return String(value ?? '');
}

// Helper function to find the label or value based on modelValue (case-insensitive)
const findValueInOption = (value: ObjectOptionValue) => {
  return props.options.find((option) => (
    String(getOptionValue(option)).toLowerCase() === value.toString().toLowerCase()
      || String(getOptionLabel(option)).toLowerCase() === value.toString().toLowerCase()
  ));
};

// Computed display value function
const displayValue = (value: ObjectOptionValue): string | number => {
  if (props.options.some(isObjectOption)) {
    const found = findValueInOption(value);
    return found ? getOptionLabel(found) : value;
  }
  return value;
};

// watch(() => [props.options.length, modelValue.value], () => {
//   if (props.options.length > 0 && (modelValue.value?.length < 3)) {
//     modelValue.value = displayValue(modelValue.value);
//   }
// });

// Filtered options computed property
const filteredOptions = computed(() => {
  if (!searchTerm.value) return props.options;

  if (Array.isArray(props.options)) {
    const normalizedSearch = searchTerm.value.toLowerCase();

    return props.options.filter((option) => (
      String(getOptionLabel(option)).toLowerCase().includes(normalizedSearch)
        || String(getOptionValue(option)).toLowerCase().includes(normalizedSearch)
    ));
  }
  return props.options;
});

const onBlur = () => {
  focus.value = false;
};
const onFocus = () => {
  focus.value = true;
};
// do not change, otherwise not working search
// have to wirk with filteredOptions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const filterFunction = <T,>(list: T[], _term: string) => list;

const inputAttrs = computed(() => ({
  ...omitAttrs(attrs, ['class', 'style']),
  ...getFormControlA11yAttrs(attrs, fieldContext, {
    invalid: props.isError,
    labelledBy: true,
  }),
}));
</script>

<template>
  <Skeleton
    v-if="loading"
    class="v-combobox-anchor w-full rounded-control"
    :class="size === 'large' ? 'h-control-lg' : 'h-control-md'"
  />
  <VCombobox
    v-else
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :display-value="displayValue"
    :filter-function="filterFunction"
    :disabled="disabled || readonly"
    class="VFormCombobox v-form-combobox"
  >
    <VComboboxAnchor
      :is-error="isError"
      :readonly="readonly"
      :disabled="disabled"
      :focused="focus"
      :class="attrs.class"
      :style="attrs.style"
    >
      <VComboboxInput
        v-bind="inputAttrs"
        :placeholder="placeholder"
        @focus="onFocus"
        @blur="onBlur"
      />
      <VComboboxTrigger>
        <template
          v-if="$slots.icon"
          #icon
        >
          <slot name="icon" />
        </template>
      </VComboboxTrigger>
    </VComboboxAnchor>
    <VComboboxContent>
      <VComboboxEmpty />
      <VComboboxGroup>
        <VComboboxItem
          v-for="item in filteredOptions"
          :key="String(getOptionValue(item))"
          :value="getOptionValue(item)"
        >
          {{ getOptionLabel(item) }}
        </VComboboxItem>
      </VComboboxGroup>
    </VComboboxContent>
  </VCombobox>
</template>

<style lang="scss">
@use '../styles/mixins.scss' as *;

.v-form-combobox{
  $root: &;

  width: 100%;
}
</style>
