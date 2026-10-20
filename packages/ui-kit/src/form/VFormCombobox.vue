<script lang="ts" setup>
import { computed, useAttrs } from 'vue';
import { CheckIcon, ChevronsUpDownIcon } from '@lucide/vue';
import { Button } from '@global-torque/ui-primitives/button';
import {
  Combobox, ComboboxAnchor, ComboboxEmpty, ComboboxInput, ComboboxItem,
  ComboboxItemIndicator, ComboboxList, ComboboxTrigger, ComboboxViewport,
} from '@global-torque/ui-primitives/combobox';
import { Skeleton } from '@global-torque/ui-primitives/skeleton';
import {
  getFormControlA11yAttrs,
  hasExplicitAttr,
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

const selectedLabel = computed(() => {
  if (modelValue.value === undefined || modelValue.value === '') return '';
  const found = findValueInOption(modelValue.value);
  return found ? getOptionLabel(found) : String(modelValue.value);
});

const comboboxRootAttrs = computed(() => {
  const rootAttrs: Record<string, unknown> = {};
  if (hasExplicitAttr(attrs, 'name')) rootAttrs.name = attrs.name;
  return rootAttrs;
});

const triggerAttrs = computed(() => ({
  ...omitAttrs(attrs, ['class', 'style', 'name']),
  // A select-like trigger, as in VFormSelect; ComboboxTrigger adds aria-expanded and aria-controls.
  role: 'combobox',
  // Removes reka's "Show popup" label, so that only the field label names the combobox.
  'aria-label': attrs['aria-label'],
  ...getFormControlA11yAttrs(attrs, fieldContext, {
    invalid: props.isError,
    labelledBy: true,
  }),
}));
</script>

<template>
  <Skeleton
    v-if="loading"
    class="h-9 w-full"
  />
  <Combobox
    v-else
    v-bind="comboboxRootAttrs"
    v-model="modelValue"
    :disabled="disabled || readonly"
    class="VFormCombobox v-form-combobox w-full"
  >
    <ComboboxAnchor as-child>
      <ComboboxTrigger as-child>
        <Button
          v-bind="triggerAttrs"
          variant="outline"
          :data-readonly="readonly || undefined"
          class="w-full justify-between border-input font-normal"
          :class="[attrs.class, {
            'text-muted-foreground': !selectedLabel,
            'bg-muted disabled:cursor-default disabled:opacity-100': readonly && !disabled,
          }]"
          :style="attrs.style"
        >
          <span class="truncate">{{ selectedLabel || placeholder }}</span>
          <slot name="icon">
            <ChevronsUpDownIcon class="opacity-50" />
          </slot>
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxList>
      <!-- The search field opens empty instead of showing the selected value. -->
      <ComboboxInput
        :display-value="() => ''"
        placeholder="Search"
        aria-label="Search"
      />
      <ComboboxViewport>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxItem
          v-for="item in options"
          :key="String(getOptionValue(item))"
          :value="getOptionValue(item)"
        >
          {{ getOptionLabel(item) }}
          <ComboboxItemIndicator>
            <CheckIcon />
          </ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxViewport>
    </ComboboxList>
  </Combobox>
</template>
