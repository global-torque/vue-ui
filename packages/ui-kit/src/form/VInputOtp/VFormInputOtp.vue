<script lang="ts" setup>
import { computed, useAttrs } from 'vue';
import {
  InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot,
} from '@global-torque/ui-primitives/input-otp';
import {
  getFormControlA11yAttrs,
  useVFormFieldContext,
} from '../formFieldContext';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  maxlength?: number;
  isError?: boolean;
  inputmode?: 'numeric' | 'text';
}>(), {
  maxlength: 6,
  isError: false,
  inputmode: 'numeric',
});

const modelValue = defineModel<string>({ default: '' });

const emit = defineEmits<{
  complete: [value: string];
}>();

const half = Math.ceil(props.maxlength / 2);
const attrs = useAttrs();
const fieldContext = useVFormFieldContext();
const otpAttrs = computed(() => ({
  ...attrs,
  ...getFormControlA11yAttrs(attrs, fieldContext, {
    invalid: props.isError,
    labelledBy: true,
  }),
}));
</script>

<template>
  <InputOTP
    v-model="modelValue"
    class="VInputOtp"
    v-bind="{ ...props, ...otpAttrs }"
    @complete="emit('complete', $event)"
  >
    <template #default="{ slots }">
      <InputOTPGroup>
        <InputOTPSlot
          v-for="(slot, i) in slots.slice(0, half)"
          :key="i"
          :index="i"
        />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot
          v-for="(slot, i) in slots.slice(half)"
          :key="i + half"
          :index="i + half"
        />
      </InputOTPGroup>
    </template>
  </InputOTP>
</template>
