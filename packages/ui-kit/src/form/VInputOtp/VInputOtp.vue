<script lang="ts" setup>
import { useAttrs } from 'vue';
import { OTPInput, type OTPInputProps } from 'vue-input-otp';

type Props = Omit<OTPInputProps, 'maxlength'> & {
  maxlength?: number;
  isError?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  maxlength: 6,
  inputmode: 'numeric',
  isError: false,
});

const modelValue = defineModel<string>({ default: '' });

const emit = defineEmits<{
  complete: [value: string];
}>();

const attrs = useAttrs();
</script>

<template>
  <OTPInput
    v-model="modelValue"
    v-bind="{ ...props, ...attrs }"
    class="VInputOtp v-input-otp"
    :class="{ 'is--error': isError }"
    @complete="emit('complete', $event)"
  >
    <template #default="slotProps">
      <div class="v-input-otp__content">
        <slot v-bind="slotProps" />
      </div>
    </template>
  </OTPInput>
</template>

<style lang="scss">
.v-input-otp {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  &.is--error .v-input-otp-slot {
    border-color: #FF7070;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
}
</style>
