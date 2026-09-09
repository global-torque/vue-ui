<script lang="ts" setup>
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui';
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui';
import { Check as check } from '@lucide/vue';
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";

const props = defineProps<CheckboxRootProps & {
  isError?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  class?: HTMLAttributes["class"];
}>();
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-slot="slotProps"
    v-bind="forwarded"
    data-slot="checkbox"
    :class="[props.class, {
      'is--readonly': readonly,
      'is--disabled': disabled,
      'is--error': isError,
    }]"
    class="VCheckbox v-checkbox"
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="v-checkbox__indicator"
    >
      <slot v-bind="slotProps">
        <check
          alt="check icon"
          class="v-checkbox__icon"
        />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

<style lang="scss">
.v-checkbox {
  $root: &;

    border: solid 1px var(--foreground);
    border-radius: 2px;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-right: 8px;
    position: relative;
    top: 5px;
    overflow: hidden;
    cursor: pointer;

  &__indicator {
    width: 100%;
    height: 100%;
    display: flex;
  }

  &__icon {
    color: var(--ui-color-text-inverse, #fff);
    width: 14px;
    height: 14px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &.is--readonly {
    pointer-events: none;
  }

  &.is--disabled {
    pointer-events: none;
    #{$root}__icon-wrap {
      opacity: .3;
    }
  }

  &__input:focus + #{$root}__icon-wrap {
    outline: none !important;
  }

  &.is--error {
    #{$root}__icon-wrap {
      border-color: #FF7070;
    }
  }
}

.v-checkbox[aria-checked="true"] {
  border-color: var(--primary);
  background: var(--primary);

  .v-checkbox__icon {
      opacity: 1;
    }

    .v-checkbox__icon-wrap {
      border-color: var(--primary);
    }
}

</style>
