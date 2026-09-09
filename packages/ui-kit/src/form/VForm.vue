<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  sendLoading?: boolean;
  sendSuccess?: boolean;
  keepLoadingSendOnSuccess?: boolean;
}>();

const isSendLoading = computed(() => (
  props.sendLoading
  || (props.keepLoadingSendOnSuccess && props.sendSuccess)
));
</script>

<template>
  <form
    class="VForm"
    novalidate
  >
    <slot :is-form-send-loading="isSendLoading" />
  </form>
</template>
