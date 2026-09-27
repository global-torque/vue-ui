<script setup lang="ts">
import {
  type PointerDownOutsideEvent,
  SelectContent,
  type SelectContentProps,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@global-torque/ui-primitives/lib/utils';
import { computed, type HTMLAttributes } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps</* @vue-ignore */ SelectContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    position: 'popper',
  },
);
const emits = defineEmits<{
  closeAutoFocus: [event: Event];
  escapeKeyDown: [event: KeyboardEvent];
  pointerDownOutside: [event: PointerDownOutsideEvent];
}>();

const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused; // Explicitly mark as intentionally unused

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SelectPortal>
    <SelectContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="cn('VSelectContent v-select-content z-[var(--ui-select-popup-z-index,var(--ui-dialog-z-index,1100))]', props.class)"
    >
      <SelectViewport class="v-select-viewport">
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>

<style lang="scss">
.v-select-content {
  padding-left: 0;
    list-style-type: none;
    background-color: var(--muted);
    border: solid 1px var(--border);
    box-shadow: var(--shadow-dialog, 0 4px 5px -2px color-mix(in srgb, var(--foreground) 5%, transparent), 0 6px 25px 2px color-mix(in srgb, var(--foreground) 6%, transparent));
    border-radius: 2px;
    max-height: 222px;
    overflow: scroll;
    width: var(--reka-select-trigger-width);
    display: flex;
  // flex-direction: column;
  // position: fixed;
  // min-width: 175px;
  // left: 636px;
  // bottom: 0px;
  // height: 638px;
  // margin: 10px 0px;
  // min-height: 125px;
  // max-height: 950px;
  // z-index: 100;
}
</style>
