<script setup lang="ts">
/**
 * VUploaderPreviewCard - File preview component for VUploader
 *
 * This component displays a preview card for uploaded files, handling both
 * new file uploads and preloaded items. It supports image previews with
 * CSP-compliant data URLs and fallback file icons for non-image files.
 *
 * Key features:
 * - CSP compliant (uses data URLs instead of blob URLs)
 * - Image preview for supported file types
 * - File icon fallback for non-images
 * - Individual file removal
 * - Memory cleanup on unmount
 */

import { File as fileIcon } from '@lucide/vue';
import { X as closeIcon } from '@lucide/vue';
import { computed, onUnmounted, ref, watch } from 'vue';

// Interface for preloaded items (e.g., from API)
interface PreloadedItem {
  id?: string | number;
  name: string;
  url: string;
  mimeType?: string;
  thumbnailUrl?: string;
}

// Component props
interface Props {
  file?: File;           // Newly uploaded file
  preloaded?: PreloadedItem;  // Pre-existing item
  index: number;          // Index in the file list
  canRemove?: boolean;    // Whether the file can be removed
}

const props = withDefaults(defineProps<Props>(), {
  canRemove: true,
});

// Component events
const emit = defineEmits<{
  'remove': [index: number];  // Emitted when file is removed
  'click': [index: number];   // Emitted when card is clicked
}>();

// Event handlers
const removeFile = (index: number) => {
  emit('remove', index);
};

// Reactive state
const dataUrl = ref<string | null>(null); // CSP-compliant data URL for image previews

// Computed properties
const isImage = computed(() => {
  // Check if current file is an image based on MIME type or file extension
  if (props.file) return props.file.type?.startsWith('image/');
  if (props.preloaded?.mimeType) return props.preloaded.mimeType.startsWith('image/');
  const url = props.preloaded?.thumbnailUrl || props.preloaded?.url || '';
  return /\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i.test(url);
});

const displayName = computed(() => {
  // Get display name from file or preloaded item
  if (props.file) return props.file.name;
  return props.preloaded?.name || '';
});

const previewSrc = computed(() => {
  // Return preview source for images only
  if (props.file && isImage.value && dataUrl.value) {
    return dataUrl.value; // Use converted data URL for new files
  }
  if (props.preloaded && isImage.value) {
    return props.preloaded.thumbnailUrl || props.preloaded.url; // Use existing URL for preloaded items
  }
  return null;
});

// Utility functions
/**
 * Convert file to data URL to avoid CSP blob URL issues
 * This ensures compatibility with Content Security Policy that blocks blob: URLs
 */
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Watchers
/**
 * Watch for file changes and convert images to data URLs
 * This handles the conversion from File objects to CSP-compliant data URLs
 */
watch(
  () => props.file,
  async (newFile) => {
    dataUrl.value = null; // Reset previous data URL

    if (newFile && newFile.type?.startsWith('image/')) {
      try {
        dataUrl.value = await fileToDataUrl(newFile);
      } catch (error) {
        console.error('Error converting file to data URL:', error);
      }
    }
  },
  { immediate: true }
);

// Lifecycle hooks
/**
 * Cleanup on component unmount to prevent memory leaks
 */
onUnmounted(() => {
  dataUrl.value = null;
});
</script>

<template>
  <!-- File preview card container -->
  <div
    class="VUploaderPreviewCard v-uploader__preview-card"
    :class="{ 'is--image': isImage }"
    role="button"
    tabindex="0"
    @click.stop="emit('click', index)"
    @keydown.enter.stop="emit('click', index)"
    @keydown.space.prevent.stop="emit('click', index)"
  >
    <!-- File preview content -->
    <div class="v-uploader__preview-card-info">
      <!-- Image preview for supported file types -->
      <template v-if="isImage && previewSrc">
        <img
          alt="preview"
          :src="previewSrc"
          class="v-uploader__preview-card-thumb is--margin-top-0"
        >
      </template>
      <!-- File icon fallback for non-image files -->
      <template v-else>
        <component
          :is="fileIcon"
          class="v-uploader__preview-card-icon"
        />
        <span class="v-uploader__preview-card-name is--small">
          {{ displayName }}
        </span>
      </template>
    </div>

    <!-- Remove button (conditionally shown) -->
    <button
      v-if="canRemove"
      type="button"
      class="v-uploader__preview-card-remove"
      title="Remove file"
      aria-label="Remove file"
      @click.stop="removeFile(index)"
    >
      <closeIcon
        alt="close icon"
        class="v-uploader__close-icon"
      />
    </button>
  </div>
</template>

<style lang="scss">
.v-uploader {
  $root: &;

  /* Preview card container styles */
  &__preview-card {
    transition: background-color 0.2s ease;

    /* Non-image file layout (horizontal) */
    &:not(.is--image) {
      width: 100%;
      display: flex;
      border-top: 1px solid var(--border);
      padding: 7px 13px 7px 10px;
      align-items: center;
      gap: 12px;
      justify-content: space-between;
    }

    /* Image file layout (square thumbnail) */
    &.is--image {
      padding: 4px;
      width: fit-content;
      position: relative;
      display: inline-block;
    }

    /* Hover effect */
    &:hover {
      background-color: var(--border);
      transition: background-color 0.2s ease;
    }
  }

  /* File info container */
  &__preview-card-info {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #343A40;
  }

  /* Remove button */
  &__preview-card-remove {
    cursor: pointer;
    display: flex;
  }

  /* Remove button positioning for images */
  &__preview-card.is--image  &__preview-card-remove {
      position: absolute;
      top: 0;
      right: 0;
      background-color: var(--background);
      padding: 2px;
      border-radius: 2px;
  }

  /* File icon */
  &__preview-card-icon {
    width: 16px;
    flex-shrink: 0;
  }

  /* Image thumbnail */
  &__preview-card-thumb {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 2px;
    flex-shrink: 0;
  }

  /* Close icon */
  &__close-icon {
    width: 15px;
    height: 15px;
    vertical-align: middle;
  }
}
</style>
