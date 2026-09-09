<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button } from '@global-torque/ui-primitives/button';
import { Upload as uploadIcon } from '@lucide/vue';
import { Skeleton } from '@global-torque/ui-primitives/skeleton';
import VUploaderPreviewCard from './VUploaderPreviewCard.vue';

interface PreloadedItem {
  id?: string | number;
  name: string;
  url: string;
  mimeType?: string;
  thumbnailUrl?: string;
}

interface Props {
  isError?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string; // e.g., "application/pdf,image/*"
  dragDropText?: string;
  uploadButtonText?: string;
  supportedFilesText?: string;
  maxSizeText?: string;
  showFilePreview?: boolean;
  showSupportedFilesInfo?: boolean;
  showMaxSizeInfo?: boolean;
  customClass?: string;
  multiple?: boolean;
  preloadedItems?: PreloadedItem[]; // new: initial items (e.g., from API)
  canUpload?: boolean; // new: controls visibility and availability of upload interactions
  canRemove?: boolean; // new: allows hiding removal in preview
}

const props = withDefaults(defineProps<Props>(), {
  isError: false,
  isDisabled: false,
  isLoading: false,
  maxFiles: 1,
  maxFileSize: 10, // 10MB default
  acceptedFileTypes: '*',
  dragDropText: 'Drag & drop files here or click to upload',
  uploadButtonText: 'Upload',
  supportedFilesText: 'all types',
  maxSizeText: '10MB',
  showFilePreview: true,
  showSupportedFilesInfo: true,
  showMaxSizeInfo: true,
  customClass: '',
  multiple: false,
  preloadedItems: () => [],
  canUpload: true,
  canRemove: true,
});

const emit = defineEmits<{
  'update:files': [files: File[]];
  'update:items': [items: PreloadedItem[]];
  'remove': [index: number];
  'removePreloaded': [payload: { index: number; id?: string | number }];
  'error': [message: string];
  'click': [index: number];
}>();

const filesUploadError = ref('');
const isDragging = ref(false);
const refFiles = ref<HTMLInputElement>();
const allFiles = ref<File[]>([]);
const allPreloaded = ref<PreloadedItem[]>([...props.preloadedItems]);

watch(
  () => props.preloadedItems,
  (val) => {
    if (Array.isArray(val)) {
      allPreloaded.value = [...val];
    }
  },
  { deep: true }
);

// Ensure unique association between label and input for accessibility
const inputId = `v-uploader-file-${Math.random().toString(36).slice(2, 10)}`;

// Validation helpers
const validateFileSize = (files: File[]): string | null => {
  const maxFileSizeInBytes = props.maxFileSize * 1024 * 1024;
  const oversizedFiles = files.filter(file => file.size >= maxFileSizeInBytes);
  return oversizedFiles.length > 0
    ? `Please upload smaller files. Limit ${props.maxFileSize}MB`
    : null;
};

const validateFileCount = (incomingFiles: File[]): string | null => {
  const currentCount = allFiles.value.length + allPreloaded.value.length;
  if (incomingFiles.length + currentCount > props.maxFiles) {
    return `You are only allowed to upload a maximum of ${props.maxFiles} files at a time`;
  }
  return null;
};

const validateDuplicateFiles = (incomingFiles: File[]): string | null => {
  const hasDuplicateWithExistingFiles = allFiles.value.some(existingFile =>
    incomingFiles.some(newFile =>
      newFile.name === existingFile.name && newFile.size === existingFile.size
    )
  );

  const hasDuplicateWithPreloaded = allPreloaded.value.some(existingItem =>
    incomingFiles.some(newFile => newFile.name === existingItem.name)
  );

  return (hasDuplicateWithExistingFiles || hasDuplicateWithPreloaded)
    ? 'New upload contains files that already exist'
    : null;
};

const setError = (message: string) => {
  filesUploadError.value = message;
  emit('error', message);
};

const onFileChange = () => {
  const fileList = refFiles.value?.files as FileList;
  const incomingFiles = Array.from(fileList || []);
  filesUploadError.value = '';

  if (incomingFiles.length === 0) return;

  // Validate file size
  const sizeError = validateFileSize(incomingFiles);
  if (sizeError) {
    setError(sizeError);
    return;
  }

  // If not multiple, replace all content with the new selection
  if (!props.multiple) {
    allFiles.value = incomingFiles.slice(0, 1);
    // In single mode, keep preloaded items unless maxFiles is 1
    if (props.maxFiles === 1) {
      allPreloaded.value = [];
    }
    emit('update:files', allFiles.value);
    emit('update:items', allPreloaded.value);
    return;
  }

  // Multiple file mode - additional validations
  const countError = validateFileCount(incomingFiles);
  if (countError) {
    setError(countError);
    setTimeout(() => {
      filesUploadError.value = '';
    }, 4000);
    return;
  }

  const duplicateError = validateDuplicateFiles(incomingFiles);
  if (duplicateError) {
    setError(duplicateError);
    return;
  }

  // Add new files to existing ones
  allFiles.value = [...allFiles.value, ...incomingFiles];
  emit('update:files', allFiles.value);
};

const triggerFileInput = () => {
  if (props.canUpload && !props.isDisabled && !props.isLoading) {
    refFiles.value?.click();
  }
};

const handleDragEvent = (e: DragEvent, isEntering: boolean) => {
  if (props.canUpload && !props.isDisabled && !props.isLoading) {
    e.preventDefault();
    isDragging.value = isEntering;
  }
};

const drop = (e: DragEvent) => {
  if (props.canUpload && !props.isDisabled && !props.isLoading) {
    e.preventDefault();
    const files = e.dataTransfer?.files as FileList;
    if (refFiles.value) refFiles.value.files = files;
    onFileChange();
    isDragging.value = false;
  }
};

const removeUnified = (index: number) => {
  const item = unifiedItems.value[index];
  if (!item) return;
  filesUploadError.value = '';

  if (item.kind === 'file') {
    const fileIndex = item.fileIndex;
    if (fileIndex != null) {
      allFiles.value.splice(fileIndex, 1);
      emit('update:files', allFiles.value);
      emit('remove', fileIndex);
    }
  } else {
    const preIndex = item.preloadedIndex;
    if (preIndex != null) {
      const removed = allPreloaded.value.splice(preIndex, 1)[0];
      emit('update:items', allPreloaded.value);
      emit('removePreloaded', { index: preIndex, id: removed?.id });
    }
  }
};

const unifiedItems = computed(() => {
  const preloadedMapped = allPreloaded.value.map((p, idx) => ({
    kind: 'preloaded' as const,
    preloaded: p,
    preloadedIndex: idx,
    file: undefined,
    fileIndex: undefined,
    key: `preloaded-${p.id ?? p.url}-${idx}`,
  }));
  const filesMapped = allFiles.value.map((f, idx) => ({
    kind: 'file' as const,
    preloaded: undefined,
    preloadedIndex: undefined,
    file: f,
    fileIndex: idx,
    key: `file-${f.name}-${f.size}-${idx}`,
  }));
  return [...preloadedMapped, ...filesMapped];
});
</script>

<template>
  <div
    class="VUploader v-uploader"
    :class="customClass"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -- drag-and-drop is a pointer-only extra; the file label and the Upload button are the controls -->
    <div
      class="v-uploader__dropzone"
      :class="{
        'is--dragging': isDragging,
        'is--error': filesUploadError || isError,
        'is--disabled': isDisabled,
        'is--loading': isLoading,
        'is--files': unifiedItems?.length > 0,
        'is--can-upload': canUpload,
      }"
      @dragover.prevent="handleDragEvent($event, true)"
      @dragleave.prevent="handleDragEvent($event, false)"
      @drop.prevent="drop"
    >
      <label
        v-if="canUpload"
        class="v-uploader__label"
        :for="inputId"
        :class="{ disabled: isDisabled || isLoading }"
      >
        <input
          :id="inputId"
          ref="refFiles"
          name="file"
          :multiple="multiple"
          type="file"
          :accept="acceptedFileTypes"
          :disabled="isDisabled || isLoading"
          @change="onFileChange"
        >
        {{ dragDropText }}
      </label>
      <Skeleton
        v-if="isLoading && canUpload"
        class="v-uploader__file-button"
        :style="{ width: '200px', height: '28px' }"
      />
      <Button
        v-else-if="canUpload"
        class="v-uploader__file-button"
        :disabled="isDisabled || isLoading"
        variant="outline"
        size="sm"
        @click.stop="triggerFileInput"
      >
        <component
          :is="uploadIcon"
          class="v-uploader__file-icon"
        />
        {{ uploadButtonText }}
      </Button>

      <div
        v-if="unifiedItems?.length && showFilePreview"
        class="v-uploader__preview"
      >
        <VUploaderPreviewCard
          v-for="(item, index) in unifiedItems"
          :key="item.key"
          :file="item.file"
          :preloaded="item.preloaded"
          :index="index"
          :can-remove="canRemove"
          @remove="removeUnified"
          @click="emit('click', index)"
        />
      </div>
    </div>

    <p
      v-if="filesUploadError"
      class="v-uploader__error is--small"
    >
      {{ filesUploadError }}
    </p>


    <Skeleton
      v-if="isLoading"
      class="v-uploader__comment is--small"
      :style="{ width: '200px', height: '17px' }"
    />

    <div
      v-else-if="showSupportedFilesInfo || showMaxSizeInfo"
      class="v-uploader__comment is--small"
    >
      <span v-if="showSupportedFilesInfo">Supported files: {{ supportedFilesText }}</span>
      <span v-if="showSupportedFilesInfo && showMaxSizeInfo">. </span>
      <span v-if="showMaxSizeInfo">Maximum size {{ maxSizeText }}</span>
    </div>
  </div>
</template>

<style lang="scss">
.v-uploader{
  $root: &;

  &__dropzone{
    display: flex;
    padding: 32px 12px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    align-self: stretch;
    border-radius: 2px;
    border: 1px dashed #CED4DA;
    background: var(--muted);

    &:focus-visible{
      border-color: var(--primary);
    }

    &.is--dragging{
      border-color: var(--primary);
    }

    &.is--error{
      border-color: #FF7070;
    }

    &.is--files:not(.is--can-upload){
      padding: 12px;
    }

    &.is--can-upload.is--files{
      padding: 32px 12px 12px;
    }

    &.is--disabled{
      opacity: 0.3;
      pointer-events: none;
      // Allow interactions in preview area so items can still be removed
      #{$root}__preview,
      #{$root}__preview * {
        pointer-events: auto;
      }
    }

    &.is--loading{
      opacity: 0.6;
      pointer-events: none;
    }

    &:hover:not(.is--disabled, .is--loading){
      border-color: var(--primary);
      cursor: pointer;
    }
  }

  input[type="file"]{
    opacity: 0;
    overflow: hidden;
    position: absolute;
    width: 1px;
    height: 1px;
  }

  &__label{
    color: var(--muted-foreground);
    text-align: center;
  }

  & &__file-button{
    margin-top: 12px;
  }

  &__file-button{
    #{$root}__dropzone.is--files &{
      margin-bottom: 32px;
    }
  }

  &__preview{
    width: 100%;
    position: relative;
    z-index: 1;
  }

  &__comment{
    color: #495057;
    margin-top: 4px;
  }

  &__error{
    margin-top: 4px;
    color: #FF7070;
  }

  &__file-icon{
    width: 16px;
  }


}
</style>
