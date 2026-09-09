<script setup lang="ts">
import {
  ComboboxContent,
  type ComboboxContentEmits,
  type ComboboxContentProps,
  ComboboxPortal,
  ComboboxViewport,
  useForwardPropsEmits,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<ComboboxContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    position: 'popper',
  },
);
const emits = defineEmits<ComboboxContentEmits>();

const delegatedProps = computed(() => {
  const { class: unused, ...delegated } = props;
  void unused; // Explicitly mark as intentionally unused

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ComboboxPortal>
    <ComboboxContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="props.class"
      class="VComboboxContent v-combobox-content"
    >
      <ComboboxViewport class="v-combobox-viewport">
        <slot />
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxPortal>
</template>

<style lang="scss">
.v-combobox-content {
  padding-left: 0;
    list-style-type: none;
    background-color: var(--muted);
    border: solid 1px var(--border);
    box-shadow: 0 4px 5px -2px rgb(18 22 31 / 5%), 0 6px 25px 2px rgb(18 22 31 / 6%);
    border-radius: 2px;
    max-height: 222px;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    width: var(--reka-combobox-trigger-width);
    z-index: 10;
    display: flex;
    touch-action: pan-y;
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
