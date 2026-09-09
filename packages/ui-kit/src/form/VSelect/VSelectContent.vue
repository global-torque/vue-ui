<script setup lang="ts">
import {
  type PointerDownOutsideEvent,
  SelectContent,
  type SelectContentProps,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits,
} from 'reka-ui';
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
      :class="props.class"
      class="VSelectContent v-select-content"
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
    box-shadow: 0 4px 5px -2px rgb(18 22 31 / 5%), 0 6px 25px 2px rgb(18 22 31 / 6%);
    border-radius: 2px;
    max-height: 222px;
    overflow: scroll;
    width: var(--reka-select-trigger-width);
    z-index: 1101;
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
