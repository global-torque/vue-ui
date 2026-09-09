<script lang="ts" setup>
import {
  computed, type HTMLAttributes, useAttrs, useId,
} from 'vue';
import VFormLabel from './VFormLabel.vue';
import { Checkbox } from '@global-torque/ui-primitives/checkbox';
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui';
import { useForwardPropsEmits } from 'reka-ui';
import {
  getFormControlA11yAttrs,
  omitAttrs,
  resolveFormControlId,
  useVFormFieldContext,
} from './formFieldContext';

defineOptions({
  inheritAttrs: false,
});

defineSlots<{
  default(): unknown;
  indicator(): unknown;
}>();

const props = defineProps<CheckboxRootProps & {
  hasAsterisk?: boolean;
  isError?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  dataTestid?: string;
  class?: HTMLAttributes['class'];
}>();

const emits = defineEmits<CheckboxRootEmits>();

const generatedId = useId();
const attrs = useAttrs();
const fieldContext = useVFormFieldContext();
const inputId = computed(() => resolveFormControlId(attrs, fieldContext, generatedId));

const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused; // Explicitly mark as intentionally unused

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
const modelValue = defineModel<boolean>();
const checkboxAttrs = computed(() => ({
  ...omitAttrs(attrs, ['class', 'style']),
  ...getFormControlA11yAttrs(attrs, fieldContext, {
    id: inputId.value,
    invalid: props.isError,
  }),
  // Safari's default keyboard-navigation mode skips buttons without an
  // explicit tabindex. Keep this custom checkbox in the sequential Tab order
  // while preserving a caller-provided tabindex override.
  tabindex: attrs.tabindex ?? 0,
}));
</script>

<template>
  <div
    class="VFormCheckbox v-form-checkbox flex items-start gap-2"
    :class="[props.class, attrs.class, { 'pointer-events-none': readonly, 'opacity-50': disabled }]"
    :style="attrs.style"
  >
    <Checkbox
      v-bind="{ ...forwarded, ...checkboxAttrs }"
      :id="inputId"
      :model-value="modelValue"
      class="VCheckbox mt-0.5"
      @update:model-value="modelValue = Boolean($event)"
    >
      <template
        v-if="$slots.indicator"
        #default
      >
        <slot name="indicator" />
      </template>
    </Checkbox>
    <VFormLabel
      v-bind="forwarded"
      :for="inputId"
      :has-asterisk="hasAsterisk"
      :disabled="disabled"
      class="v-form-checkbox__label font-normal leading-snug"
    >
      <slot />
    </VFormLabel>
  </div>
</template>
