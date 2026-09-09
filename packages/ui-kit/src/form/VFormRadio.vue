<script lang="ts" setup>
import {
  ref, computed, useAttrs, useId,
} from 'vue';
import VFormLabel from './VFormLabel.vue';
import { RadioGroup, RadioGroupItem } from '@global-torque/ui-primitives/radio-group';
import {
  getFormControlA11yAttrs,
  omitAttrs,
  resolveFormControlId,
  useVFormFieldContext,
} from './formFieldContext';

defineOptions({
  inheritAttrs: false,
});

defineSlots<{ indicator?: () => unknown }>();

type FormRadioOption = {
  value: string | number | boolean;
  text: string;
  message?: string;
};

const props = withDefaults(defineProps<{
  modelValue: string | string[] | number[] | boolean;
  options?: Record<string | number, string | number | boolean> | string[] | FormRadioOption[];
  row?: boolean;
  disabled?: boolean;
}>(), {
  options: () => [],
});

const emit = defineEmits<{(e: 'update:modelValue', value: boolean | string | string[] | number[]): void;}>();

function isObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sortBy<T extends object>(collection: T[], param: string): T[] {
  collection.sort((a, b) => {
    if (!isObject(a) || !isObject(b)) throw new Error('sortBy expect array of objects as argument');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (a[param] < b[param]) return -1;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (a[param] > b[param]) return 1;
    return 0;
  });
  return collection;
}

const selectedOption = ref(props.modelValue);
const attrs = useAttrs();
const fieldContext = useVFormFieldContext();

const formattedOptions = computed<FormRadioOption[]>(() => {
  const options = props.options;
  if (!Array.isArray(options)) {
    // Make array from object
    let normalizedOptions: FormRadioOption[] = Object
      .entries(options)
      .map(([text, value]) => ({
        value,
        text: String(text),
      }));
    // Sort options by text if more than 7
    if (normalizedOptions.length > 7) {
      normalizedOptions = sortBy(normalizedOptions, 'text');
    }
    return normalizedOptions;
  }

  return options.map((option) => (typeof option === 'string'
    ? { value: option, text: option }
    : option));
});

function getInputValue(option: FormRadioOption) {
  return option.value;
}

function getLabelValue(option: FormRadioOption) {
  return option.text;
}

const generatedId = useId();
const groupId = computed(() => resolveFormControlId(attrs, fieldContext, generatedId));
const groupAttrs = computed(() => ({
  ...omitAttrs(attrs, ['class', 'style', 'name']),
  ...getFormControlA11yAttrs(attrs, fieldContext, {
    id: groupId.value,
    labelledBy: true,
  }),
}));

function getOptionId(index: number) {
  return `${groupId.value}-${index}`;
}
// the primitive group speaks strings; the option keeps its own value type
const stringValue = (option: FormRadioOption) => String(getInputValue(option));
const selectedString = computed(() => (
  formattedOptions.value.find(option => getInputValue(option) === selectedOption.value)
    ? stringValue(formattedOptions.value.find(option => getInputValue(option) === selectedOption.value)!)
    : String(selectedOption.value ?? '')
));
function onSelect(value: unknown) {
  const option = formattedOptions.value.find(candidate => stringValue(candidate) === String(value));
  if (!option) return;
  selectedOption.value = getInputValue(option) as typeof selectedOption.value;
  emit('update:modelValue', selectedOption.value as boolean | string | string[] | number[]);
}
</script>

<template>
  <RadioGroup
    v-bind="groupAttrs"
    :model-value="selectedString"
    :name="attrs.name ? String(attrs.name) : groupId"
    :disabled="disabled"
    class="VFormRadio v-form-radio"
    :class="[attrs.class, row ? 'flex-row flex-wrap items-center gap-x-6 gap-y-2' : 'flex-col gap-3']"
    :style="attrs.style"
    @update:model-value="onSelect"
  >
    <div
      v-for="(option, index) in formattedOptions"
      :key="index"
      class="v-form-radio__item flex items-center gap-2"
    >
      <div class="v-form-radio__item-input contents">
        <RadioGroupItem
          :id="getOptionId(index)"
          :value="stringValue(option)"
          :disabled="disabled"
        >
          <template
            v-if="$slots.indicator"
            #default
          >
            <slot name="indicator" />
          </template>
        </RadioGroupItem>
        <VFormLabel
          :for="getOptionId(index)"
          :disabled="disabled"
          class="font-normal"
        >
          {{ getLabelValue(option) }}
        </VFormLabel>
      </div>
    </div>
  </RadioGroup>
</template>
