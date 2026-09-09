<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<script lang="ts" setup>
import {
  computed, ref, useAttrs, watch,
} from 'vue';
import type { DateValue } from '@internationalized/date';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';
import { Calendar as CalendarIcon } from '@lucide/vue';
import { Button } from '@global-torque/ui-primitives/button';
import { Calendar } from '@global-torque/ui-primitives/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@global-torque/ui-primitives/popover';
import { Skeleton } from '@global-torque/ui-primitives/skeleton';
import {
  getFormControlA11yAttrs,
  omitAttrs,
  useVFormFieldContext,
} from './formFieldContext';

defineOptions({
  inheritAttrs: false,
});

interface Props {
  placeholder?: string;
  modelValue?: string;
  isError?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  dataTestid?: string;
  size?: 'large' | 'medium' | 'small';
  loading?: boolean;
  calendarLayout?: 'default' | 'month-and-year';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'MM/DD/YYYY',
  size: 'medium',
  calendarLayout: 'month-and-year',
});

const emit = defineEmits<{(e: 'update:modelValue', value: string): void}>();

const open = ref(false);
const focused = ref(false);
const attrs = useAttrs();
const fieldContext = useVFormFieldContext();
const sizeClass = computed(() => ({ small: 'h-control-sm', medium: 'h-control-md', large: 'h-control-lg' }[props.size]));

function stringToDate(value: string): DateValue | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  try {
    return parseDate(value);
  } catch {
    return undefined;
  }
}

function dateToString(date: DateValue): string {
  const y = date.year;
  const m = String(date.month).padStart(2, '0');
  const d = String(date.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(date: DateValue): string {
  const m = String(date.month).padStart(2, '0');
  const d = String(date.day).padStart(2, '0');
  const y = date.year;
  return `${m}/${d}/${y}`;
}

const selectedDate = computed({
  get: () => stringToDate(props.modelValue),
  set: (v: DateValue | undefined) => {
    emit('update:modelValue', v ? dateToString(v) : '');
  },
});

const placeholderDate = computed(() => selectedDate.value ?? today(getLocalTimeZone()));

const displayText = computed(() => {
  const d = stringToDate(props.modelValue);
  return d ? formatDisplay(d) : '';
});

function onOpenChange(isOpen: boolean) {
  open.value = isOpen;
  if (!isOpen) focused.value = false;
}

function onFocus() {
  focused.value = true;
}

function onBlur() {
  if (!open.value) focused.value = false;
}

const triggerAttrs = computed(() => ({
  ...omitAttrs(attrs, ['class', 'style']),
  ...getFormControlA11yAttrs(attrs, fieldContext, {
    invalid: props.isError,
    labelledBy: true,
    includeControlInLabel: true,
  }),
}));

watch(selectedDate, (val) => {
  if (val) open.value = false;
});
watch(() => props.modelValue, () => { /* sync external changes */ });
</script>

<template>
  <Skeleton
    v-if="loading"
    class="VFormDatePicker v-form-date-picker w-full rounded-control"
    :class="sizeClass"
  />
  <Popover
    v-else
    v-model:open="open"
    @update:open="onOpenChange"
  >
    <PopoverTrigger
      as-child
      :disabled="disabled || readonly"
    >
      <Button
        v-bind="triggerAttrs"
        variant="outline"
        type="button"
        data-slot="input"
        :disabled="disabled || readonly"
        :data-readonly="readonly || undefined"
        :data-disabled="disabled || undefined"
        aria-haspopup="dialog"
        :aria-expanded="open"
        :aria-invalid="isError || undefined"
        class="VFormDatePicker v-form-date-picker w-full justify-between rounded-control border-input bg-control-background px-3 text-control font-normal text-foreground shadow-none hover:bg-control-background hover:text-foreground"
        :class="[attrs.class, sizeClass]"
        :style="attrs.style"
        :data-testid="dataTestid ?? attrs['data-testid']"
        @focus="onFocus"
        @blur="onBlur"
      >
        <span
          class="v-form-date-picker__value truncate"
          :class="{ 'text-muted-foreground': !displayText }"
        >
          {{ displayText || placeholder }}
        </span>
        <template v-if="!readonly">
          <slot name="icon">
            <CalendarIcon
              class="size-4 shrink-0 opacity-50"
              aria-hidden="true"
            />
          </slot>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent
      class="v-form-date-picker__content w-auto p-0"
      align="start"
      :side-offset="4"
      @interact-outside="onBlur"
    >
      <Calendar
        v-model="selectedDate"
        :placeholder="placeholderDate"
        :layout="calendarLayout === 'default' ? undefined : calendarLayout"
      />
    </PopoverContent>
  </Popover>
</template>

<style>
.v-form-date-picker[data-slot='input'] {
  display: var(--ui-form-date-display, revert-layer);
  position: var(--ui-form-date-position, revert-layer);
  padding-block: var(--ui-form-date-padding-block, revert-layer);
  gap: var(--ui-form-date-gap, revert-layer);
}

.v-form-date-picker__value {
  flex: var(--ui-form-date-value-flex, revert-layer);
  min-width: var(--ui-form-date-value-min-width, revert-layer);
  text-align: var(--ui-form-date-value-align, revert-layer);
}

.v-form-date-picker[data-readonly] {
  border-width: var(--ui-form-readonly-border-width, revert-layer);
  border-radius: var(--ui-form-readonly-radius, revert-layer);
  pointer-events: var(--ui-form-readonly-pointer-events, revert-layer);
}

.v-form-date-picker[data-readonly]:not([data-disabled]) {
  opacity: var(--ui-form-readonly-opacity, revert-layer);
}

.v-form-date-picker[data-disabled] {
  opacity: var(--ui-form-disabled-opacity, revert-layer);
}
</style>
