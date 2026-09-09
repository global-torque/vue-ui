<script setup lang="ts">
import { Button } from "@global-torque/ui-primitives/button";
import type { ProfileSelectionItem } from "./types";

withDefaults(
  defineProps<{
    items: readonly ProfileSelectionItem[];
    selectedId?: string;
    loading?: boolean;
    disabled?: boolean;
    label?: string;
    loadingLabel?: string;
    emptyLabel?: string;
  }>(),
  {
    label: "Investment profiles",
    loadingLabel: "Loading profiles…",
    emptyLabel: "No profiles available.",
  },
);

defineEmits<{ select: [id: string] }>();
</script>

<template>
  <section
    class="profile-selector"
    :aria-label="label"
    :aria-busy="loading"
  >
    <p
      v-if="loading"
      class="profile-selector__message"
      role="status"
    >
      {{ loadingLabel }}
    </p>
    <ul
      v-else-if="items.length"
      class="profile-selector__list"
    >
      <li
        v-for="item in items"
        :key="item.id"
      >
        <Button
          type="button"
          variant="ghost"
          class="profile-selector__button"
          :aria-pressed="item.id === selectedId"
          :disabled="disabled || item.disabled"
          @click="$emit('select', item.id)"
        >
          <span class="profile-selector__name">{{ item.label }}</span>
          <span
            v-if="item.description"
            class="profile-selector__description"
          >{{
            item.description
          }}</span>
        </Button>
      </li>
    </ul>
    <p
      v-else
      class="profile-selector__message"
      role="status"
    >
      {{ emptyLabel }}
    </p>
  </section>
</template>

<style scoped>
.profile-selector {
  min-width: 0;
  font-family: inherit;
  color: var(--foreground, #17202a);
}
.profile-selector__list {
  display: grid;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
  list-style: none;
}
.profile-selector__button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  height: auto;
  min-height: 2.75rem;
  padding: 0.75rem;
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: left;
  border: 1px solid var(--border, #d9dee5);
}
.profile-selector__button[aria-pressed="true"] {
  background: var(--accent, #edf1f5);
  color: var(--accent-foreground, #17202a);
}
.profile-selector__name {
  font-weight: 600;
}
.profile-selector__description {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--muted-foreground, #526070);
}
.profile-selector__message {
  margin: 0;
  padding: 0.75rem;
}
</style>
