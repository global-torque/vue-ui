<script lang="ts" setup>
import VFormInput from './VFormInput.vue';
import { computed, ref, watch } from 'vue';
import { Search, X } from '@lucide/vue';

defineSlots<{
  'search-icon'?: () => unknown;
  'clear-icon'?: () => unknown;
}>();

const props = defineProps({
  modelValue: String,
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void;
  (e: '@update:modelValue', value: string | undefined): void;
}>();

const model = ref(props.modelValue);

const showClearButton = computed(() => Boolean(model.value));

const onClearClick = () => {
  model.value = '';
};
watch(() => model.value, () => {
  emit('update:modelValue', model.value);
  emit('@update:modelValue', model.value);
});
watch(() => props.modelValue, () => {
  model.value = props.modelValue;
});
</script>

<template>
  <div
    class="VFormInputSearch v-form-input-search"
  >
    <VFormInput
      :model-value="model"
      name="search"
      append
      prepend
      v-bind="$attrs"
      placeholder="Search"
      class="v-form-input-search__search-input"
      @update:model-value="model = $event"
    >
      <template #append>
        <slot name="search-icon">
          <Search
            class="v-form-input-search__search-icon size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </slot>
      </template>
      <template #prepend>
        <button
          v-if="showClearButton"
          type="button"
          aria-label="Clear search"
          @click="onClearClick"
        >
          <slot name="clear-icon">
            <component
              :is="X"
              class="v-form-input-search__close-icon"
            />
          </slot>
        </button>
      </template>
    </VFormInput>
  </div>
</template>
