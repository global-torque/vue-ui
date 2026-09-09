<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<script lang="ts" setup>
import {
  computed, ref, useAttrs, watch,
} from 'vue';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@global-torque/ui-primitives/input-group';
import { Mask, MaskTokens as IMaskTokens } from 'maska';
import { vMaska } from 'maska/vue';
import { Skeleton } from '@global-torque/ui-primitives/skeleton';
import {
  getFormControlA11yAttrs,
  omitAttrs,
  useVFormFieldContext,
} from './formFieldContext';

defineOptions({
  inheritAttrs: false,
});

// IMPORTANT: before using this component you need to install maska
// type in the terminal yarn add maska

interface Props {
  placeholder?: string;
  modelValue?: string;
  type?: string;
  isError?: boolean;
  mask?: string;
  maskTokens?: IMaskTokens;
  moneyFormat?: boolean;
  moneyLocale?: string;
  moneyCurrency?: string;
  disallowSpecialChars?: boolean;
  disallowNumbers?: boolean;
  allowIntegerOnly?: boolean;
  allowChars?: string[];
  disallowChars?: string[];
  append?: boolean;
  prepend?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  autoFocused?: boolean;
  dataTestid?: string;
  size?: 'large' | 'medium' | 'small';
  returnMaskedValue?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  size: 'medium',
  moneyLocale: 'en-US',
  moneyCurrency: 'USD',
});

const moneyFormatOptions = computed(() => {
  const numberParts = Intl.NumberFormat(props.moneyLocale).formatToParts(12345.6);
  const groupSeparator = numberParts.find((part) => part.type === 'group')?.value;
  const decimalSeparator = numberParts.find((part) => part.type === 'decimal')?.value;

  return {
    mask: '0',
    reversed: true,
    tokens: {
      0: { pattern: /\d/, multiple: true },
      9: { pattern: /\d/, optional: true },
    },
    preProcess: (value: string) => {
      let normalized = value;
      if (groupSeparator) normalized = normalized.replaceAll(groupSeparator, '');
      if (decimalSeparator && decimalSeparator !== '.') {
        normalized = normalized.replace(decimalSeparator, '.');
      }
      return normalized.replace(/[^\d.]/g, '');
    },
    postProcess: (value: string) => {
      if (!value) return '';

      const fractionDigits = value.split('.')[1]?.length ?? 0;
      return Intl.NumberFormat(props.moneyLocale, {
        style: 'currency',
        currency: props.moneyCurrency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(Number(value));
    },
  };
});

const emit = defineEmits<{(e: 'update:modelValue', value: string): void;
  (e: 'enter'): void;
}>();

const localValue = ref('');
const focused = ref(false);
const attrs = useAttrs();
const fieldContext = useVFormFieldContext();
const sizeClass = computed(() => ({ small: 'h-control-sm', medium: 'h-control-md', large: 'h-control-lg' }[props.size]));

const mask = computed(() => new Mask({
  mask: props.mask,
  tokens: props.maskTokens,
}));
const unmaskedLocalValue = computed(() => mask.value.unmasked(localValue.value));
const returnValue = computed(() => (
  (!props.mask || props.maskTokens || props.returnMaskedValue) ? localValue.value : unmaskedLocalValue.value
));
const maskOptions = computed(() => (props.moneyFormat ? moneyFormatOptions.value : undefined));
const inputAttrs = computed(() => ({
  ...omitAttrs(attrs, ['class', 'style']),
  ...getFormControlA11yAttrs(attrs, fieldContext, {
    invalid: props.isError,
  }),
}));

function getEscapedRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

const disallowedCharacters = computed(() => {
  const characters = new Set<string>();
  const addCharacters = (value: string) => [...value].forEach((character) => characters.add(character));

  if (props.disallowSpecialChars) addCharacters('@&#+$~%^:*?<>{}[]!)(_/\\|=`;"');
  if (props.disallowNumbers) addCharacters('0123456789');
  if (props.disallowChars) addCharacters(props.disallowChars.join(''));
  props.allowChars?.forEach((character) => characters.delete(character));

  return characters;
});
const disallowCharsRegex = computed(() => {
  const characters = [...disallowedCharacters.value].join('');
  return characters ? new RegExp(`[${getEscapedRegExp(characters)}]`, 'g') : null;
});

function onFilterSpecialCharsKeyDown(event: KeyboardEvent) {
  if (disallowedCharacters.value.has(event.key)) {
    event.preventDefault();
  }
}

function onFilterSpecialCharsBeforeInput(event: InputEvent) {
  if (disallowCharsRegex.value && (event.data || '').search(disallowCharsRegex.value) >= 0) {
    event.preventDefault();
  }
}

function onIntegerKeyDown(event: KeyboardEvent) {
  if (['.', ',', '+', '-', 'e', 'E'].includes(event.key)) {
    event.preventDefault();
  }
}

function onIntegerBeforeInput(event: InputEvent) {
  if (event.data === '.') event.preventDefault();
}

function onBeforeInput(event: InputEvent) {
  if (props.allowIntegerOnly) onIntegerBeforeInput(event);
  onFilterSpecialCharsBeforeInput(event);
}

function onKeyDown(event: KeyboardEvent) {
  if (props.allowIntegerOnly) onIntegerKeyDown(event);
  onFilterSpecialCharsKeyDown(event);
}

function onInput(value: string) {
  const charsToCheck = props.allowIntegerOnly ? /[^\d]/g : disallowCharsRegex.value;

  localValue.value = charsToCheck ? String(value).replace(charsToCheck, '') : String(value);
  if (props.mask) localValue.value = mask.value.masked(localValue.value);
  emit('update:modelValue', returnValue.value.trim());
}

// On user paste from buffer
function onPaste(event: ClipboardEvent) {
  const clipboardData = event.clipboardData?.getData('text/plain');
  const charsToCheck = props.allowIntegerOnly ? /[^\d]/g : disallowCharsRegex.value;
  const filteredClipboardData = (charsToCheck
    ? String(clipboardData).replace(charsToCheck, '')
    : String(clipboardData))
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
  event.preventDefault();
  onInput(filteredClipboardData);
}

function onFocus() {
  focused.value = true;
}

function onBlur() {
  focused.value = false;
}

// TODO: this has to be worked on as it gives bug in chrome on click
// const vFocus = (el: HTMLElement, value: boolean | undefined) => value && el.focus();

// check modelValue data
if (props.modelValue !== '') onInput(props.modelValue);
watch(() => props.modelValue, () => onInput(props.modelValue));
watch([() => props.mask, () => props.maskTokens], () => onInput(localValue.value), { deep: true });

</script>

<template>
  <Skeleton
    v-if="loading"
    class="VFormInput v-form-input w-full rounded-control"
    :class="sizeClass"
  />
  <InputGroup
    v-else
    class="VFormInput v-form-input"
    :class="[attrs.class, sizeClass, { 'pointer-events-none opacity-50': disabled }]"
    :style="attrs.style"
    :data-disabled="disabled || undefined"
  >
    <InputGroupAddon
      v-if="append"
      align="inline-start"
      class="v-form-input__append"
    >
      <slot name="append" />
    </InputGroupAddon>
    <InputGroupInput
      v-maska="maskOptions"
      :model-value="localValue"
      class="v-form-input__input"
      :placeholder="placeholder"
      :type="type"
      :title="localValue"
      :readonly="readonly"
      :disabled="disabled"
      v-bind="inputAttrs"
      :data-testid="dataTestid"
      @update:model-value="onInput"
      @paste="onPaste"
      @keydown="onKeyDown"
      @beforeinput="onBeforeInput"
      @focus="onFocus"
      @blur="onBlur"
      @keypress.enter="emit('enter')"
    />
    <InputGroupAddon
      v-if="prepend"
      align="inline-end"
      class="v-form-input__prepend"
    >
      <slot name="prepend" />
    </InputGroupAddon>
  </InputGroup>
</template>
