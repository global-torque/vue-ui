<script lang="ts" setup>
import { ref, watch } from 'vue';
import VFormCheckbox from './VFormCheckbox.vue';

const props = withDefaults(defineProps<{
  options?: string[];
  modelValue: string[];
}>(), {
  options: () => [],
});

const emit = defineEmits<{(e: 'update:modelValue', value: string[]): void;
}>();

const value = ref([...props.modelValue]);

function onUpdate(option: string, checked: boolean) {
  value.value = checked
    ? [...new Set([...value.value, option])]
    : value.value.filter((item) => item !== option);
  emit('update:modelValue', [...value.value]);
}

watch(() => props.modelValue, () => {
  value.value = [...props.modelValue];
});
</script>

<template>
  <div class="VFormCheckboxGroup v-form-checkbox-group">
    <template
      v-for="(option, index) in options"
      :key="index"
    >
      <VFormCheckbox
        v-bind="$attrs"
        :model-value="value.includes(option)"
        class="v-form-checkbox-group__item"
        @update:model-value="onUpdate(option, Boolean($event))"
      >
        <span> {{ option }}</span>
      </VFormCheckbox>
    </template>
  </div>
</template>

<style lang="scss">
.v-form-checkbox-group {
  $root: &;

  width: 100%;

  --v-form-checkbox-group-item--padding-default: var(--v-form-checkbox-group-item--padding, 15px 12px);
  --v-form-checkbox-group-item--background-color: var(--ui-color-border-subtle, #E9ECEF);

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  &__item {
    padding: var(--v-form-checkbox-group-item--padding-default);
    width: 100%;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--v-form-checkbox-group-item--background-color);
    }
  }
}
</style>
