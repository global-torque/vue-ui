<script lang="ts" setup>
import { useVModel } from '@vueuse/core';
import { computed, useAttrs } from 'vue';
import { Skeleton } from '@global-torque/ui-primitives/skeleton';
import { Textarea } from '@global-torque/ui-primitives/textarea';
import {
  getFormControlA11yAttrs,
  useVFormFieldContext,
} from './formFieldContext';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  defaultValue?: string | number;
  modelValue?: string | number;
  isError?: boolean;
  loading?: boolean;
  readonly?: boolean;
  disabled?: boolean;
}>();

const emits = defineEmits<{(e: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const attrs = useAttrs();
const fieldContext = useVFormFieldContext();
const textareaAttrs = computed(() => ({
  ...attrs,
  ...getFormControlA11yAttrs(attrs, fieldContext, {
    invalid: props.isError,
  }),
}));
</script>

<template>
  <Skeleton
    v-if="loading"
    class="h-[50px] w-full rounded-control"
  />
  <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
  <Textarea
    v-else
    v-model="modelValue"
    v-bind="textareaAttrs"
    class="VFormTextarea v-form-textarea"
    :readonly="readonly"
    :disabled="disabled"
  />
</template>

<style>
.v-form-textarea {
  display: var(--ui-form-textarea-display, revert-layer);
  field-sizing: var(--ui-form-textarea-sizing, revert-layer);
  min-height: var(--ui-form-textarea-min-height, revert-layer);
  padding: var(--ui-form-textarea-padding, revert-layer);
  line-height: var(--ui-form-textarea-line-height, revert-layer);
}
</style>
