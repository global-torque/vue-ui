<script lang="ts" setup>
import { ref, computed, useAttrs } from 'vue';
import VFormInput from './VFormInput.vue';
import { Eye, EyeOff } from '@lucide/vue';
import {
  resolveFormControlId,
  useVFormFieldContext,
} from './formFieldContext';

defineOptions({
  inheritAttrs: false,
});

interface Props {
  modelValue?: string;
  placeholder?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  isError?: boolean;
  class?: string;
  showStrength?: boolean;
  revealTabbable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Enter password',
  name: 'password',
  size: 'medium',
  disabled: false,
  isError: false,
  class: '',
  showStrength: false,
  revealTabbable: true,
});

const emit = defineEmits<{(e: 'update:modelValue', value: string): void; (e: 'strength-change', score: number): void;}>();

defineSlots<{
  'visibility-icon'(props: { visible: boolean }): unknown;
}>();

const showPassword = ref(false);
const attrs = useAttrs();
const fieldContext = useVFormFieldContext();

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

function onUpdateModelValue(val: string) {
  emit('update:modelValue', val);
  emit('strength-change', calculatePasswordStrength(val));
}

const calculatePasswordStrength = (password: string): number => {
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;

  // Contains number
  if (/\d/.test(password)) score += 1;

  // Contains lowercase
  if (/[a-z]/.test(password)) score += 1;

  // Contains uppercase
  if (/[A-Z]/.test(password)) score += 1;

  // Contains special character
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  return Math.min(score, 4);
};

const passwordScore = computed(() => {
  if (!props.modelValue) return 0;
  return calculatePasswordStrength(props.modelValue);
});

const strengthColor = computed(() => {
  const score = passwordScore.value;
  switch (score) {
    case 1: return 'var(--ui-password-strength-weak, #ff5252)';
    case 2: return 'var(--ui-password-strength-fair, #eec32d)';
    case 3: return 'var(--ui-password-strength-good, #a6cd0c)';
    case 4: return 'var(--ui-password-strength-strong, #00d395)';
    default: return 'transparent';
  }
});

const strengthWidth = computed(() => {
  const score = passwordScore.value;
  return `${(score / 4) * 100}%`;
});

const passwordInputId = computed(() => resolveFormControlId(attrs, fieldContext));
</script>

<template>
  <div class="VFormInputPassword v-form-input-password">
    <VFormInput
      v-bind="attrs"
      :model-value="modelValue"
      :type="showPassword ? 'text' : 'password'"
      :placeholder="placeholder"
      :name="name"
      :size="size"
      :disabled="disabled"
      :is-error="isError"
      :class="props.class"
      prepend
      @update:model-value="onUpdateModelValue"
    >
      <template #prepend>
        <button
          class="v-form-input-password__icon-wrap flex items-center text-muted-foreground hover:text-foreground"
          type="button"
          :disabled="disabled"
          :tabindex="revealTabbable ? undefined : -1"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          :aria-pressed="showPassword"
          :aria-controls="passwordInputId"
          @click="togglePasswordVisibility"
        >
          <slot
            name="visibility-icon"
            :visible="showPassword"
          >
            <component
              :is="showPassword ? Eye : EyeOff"
              class="v-form-input-password__icon size-4"
              aria-hidden="true"
            />
          </slot>
        </button>
      </template>
    </VFormInput>

    <div
      v-if="showStrength"
      class="v-form-input-password__strength-bar mt-1.5"
    >
      <div class="v-form-input-password__strength-track relative h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          class="v-form-input-password__strength-bar--fill absolute inset-y-0 left-0 rounded-full transition-[width]"
          :style="{
            width: strengthWidth,
            backgroundColor: strengthColor,
          }"
        />
      </div>
      <div class="v-form-input-password__strength-bar-name mt-1 text-right text-xs text-muted-foreground">
        At least 8 symbols
      </div>
    </div>
  </div>
</template>
