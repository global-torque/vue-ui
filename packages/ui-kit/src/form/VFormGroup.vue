<script lang="ts" setup>
import {
  computed,
  onMounted,
  onUpdated,
  ref,
  useId,
  watch,
} from 'vue';
import { CircleQuestionMark } from '@lucide/vue';
import { FieldDescription, FieldError } from '@global-torque/ui-primitives/field';
import { Label } from '@global-torque/ui-primitives/label';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@global-torque/ui-primitives/tooltip';
import {
  createFormFieldContext,
  VFormFieldContextProvider,
} from './formFieldContext';

const props = defineProps<{
  inputId?: string;
  labelId?: string;
  errorId?: string;
  helperId?: string;
  label?: string;
  errorText?: string[];
  helperText?: string;
  required?: boolean;
  dark?: boolean;
}>();


const errorText = computed(() => {
  return props.errorText?.join(', ') || '';
});
const isError = computed(() => (errorText.value?.length > 0));
const generatedId = useId();
const fallbackInputId = computed(() => props.inputId ?? `${generatedId}-input`);
const effectiveInputId = ref(fallbackInputId.value);
const resolvedInputId = computed(() => effectiveInputId.value);
const labelId = computed(() => (props.label ? (props.labelId ?? `${generatedId}-label`) : undefined));
const errorId = computed(() => (isError.value ? (props.errorId ?? `${generatedId}-error`) : undefined));
const helperId = computed(() => (props.helperText ? (props.helperId ?? `${generatedId}-helper`) : undefined));
const isRequired = computed(() => Boolean(props.required));
const root = ref<HTMLElement | null>(null);

const fieldContext = createFormFieldContext({
  inputId: resolvedInputId,
  labelId,
  errorId,
  helperId,
  invalid: isError,
  required: isRequired,
});

const managedAttributeName = (attribute: string) => `data-v-form-group-managed-${attribute.replace(/[^a-z0-9-]/gi, '-')}`;

function setManagedAttribute(element: HTMLElement, attribute: string, value?: string) {
  const marker = managedAttributeName(attribute);
  const hasExplicitValue = element.hasAttribute(attribute) && !element.hasAttribute(marker);

  if (hasExplicitValue) return;

  if (value) {
    element.setAttribute(attribute, value);
    element.setAttribute(marker, '');
    return;
  }

  if (element.hasAttribute(marker)) {
    element.removeAttribute(attribute);
    element.removeAttribute(marker);
  }
}

function syncControlAttributes() {
  const control = root.value?.querySelector<HTMLElement>([
    '[role="radiogroup"]',
    '[role="combobox"]',
    '[role="checkbox"]',
    '.VInputOtp',
    'input:not([type="hidden"])',
    'textarea',
    'select',
    'button',
    '[tabindex]',
  ].join(','));

  if (!control) return;

  const idMarker = managedAttributeName('id');
  const explicitId = control.hasAttribute('id') && !control.hasAttribute(idMarker)
    ? control.getAttribute('id')
    : undefined;
  const nextInputId = explicitId || fallbackInputId.value;

  if (!explicitId) {
    control.setAttribute('id', nextInputId);
    control.setAttribute(idMarker, '');
  }

  effectiveInputId.value = nextInputId;

  setManagedAttribute(control, 'aria-describedby', fieldContext.describedBy.value);
  setManagedAttribute(control, 'aria-invalid', isError.value ? 'true' : undefined);
  setManagedAttribute(control, 'aria-required', isRequired.value ? 'true' : undefined);

  if (
    control.getAttribute('role') === 'radiogroup'
    || control.classList.contains('VInputOtp')
  ) {
    setManagedAttribute(control, 'aria-labelledby', labelId.value);
  }
}

watch([
  fallbackInputId,
  labelId,
  errorId,
  helperId,
  fieldContext.describedBy,
  isError,
  isRequired,
], syncControlAttributes, { immediate: true });
onMounted(syncControlAttributes);
onUpdated(syncControlAttributes);

</script>

<template>
  <div
    ref="root"
    class="VFormGroup v-form-group relative flex w-full flex-col"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/label-has-for -->
    <Label
      v-if="label"
      :id="labelId"
      :for="resolvedInputId"
      class="v-form-group__label mb-[7px]"
      :class="{ 'v-form-group__label--dark text-primary-foreground': dark }"
    >
      {{ label }}
      <span
        v-if="required"
        class="v-form-group__label-required text-destructive"
      >*</span>
      <TooltipProvider v-if="$slots.tooltip">
        <Tooltip>
          <TooltipTrigger as-child>
            <CircleQuestionMark
              class="v-form-group__label-icon size-4 cursor-pointer text-muted-foreground"
              aria-hidden="true"
            />
          </TooltipTrigger>
          <TooltipContent>
            <slot name="tooltip" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Label>
    <div class="v-form-group__input relative w-full">
      <VFormFieldContextProvider :context="fieldContext">
        <slot
          :is-field-error="isError"
          :input-id="resolvedInputId"
          :label-id="labelId"
          :error-id="errorId"
          :helper-id="helperId"
          :described-by="fieldContext.describedBy.value"
          :is-field-required="required"
        />
      </VFormFieldContextProvider>
    </div>
    <FieldError
      v-if="isError"
      :id="errorId"
      class="v-form-group__error"
      data-testid="input-error"
    >
      <slot name="error">
        {{ errorText }}
      </slot>
    </FieldError>
    <FieldDescription
      v-if="helperText"
      :id="helperId"
      class="v-form-group__helper"
    >
      {{ helperText }}
    </FieldDescription>
  </div>
</template>
