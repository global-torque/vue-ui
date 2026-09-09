<script setup lang="ts">
import { VImage } from "@global-torque/ui-kit/image";
import { Button } from "@global-torque/ui-primitives/button";
import type { OfferCardData } from "./types";

withDefaults(
  defineProps<{
    offer?: OfferCardData;
    loading?: boolean;
    disabled?: boolean;
    actionLabel?: string;
    loadingLabel?: string;
    emptyLabel?: string;
  }>(),
  {
    actionLabel: "View offer",
    loadingLabel: "Loading offer…",
    emptyLabel: "No offer available.",
  },
);

defineEmits<{ select: [id: string] }>();
</script>

<template>
  <article
    class="offer-card"
    :aria-busy="loading"
  >
    <p
      v-if="loading"
      class="offer-card__message"
      role="status"
    >
      {{ loadingLabel }}
    </p>
    <template v-else-if="offer">
      <VImage
        v-if="offer.image"
        v-bind="offer.image"
        class="offer-card__image"
        loading="lazy"
        fit="cover"
      />
      <div class="offer-card__body">
        <h2 class="offer-card__title">
          {{ offer.title }}
        </h2>
        <p
          v-if="offer.description"
          class="offer-card__description"
        >
          {{ offer.description }}
        </p>
        <dl
          v-if="offer.facts?.length"
          class="offer-card__facts"
        >
          <div
            v-for="(fact, index) in offer.facts"
            :key="index"
            class="offer-card__fact"
          >
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>
        <Button
          type="button"
          class="offer-card__action"
          :disabled="disabled"
          @click="$emit('select', offer.id)"
        >
          {{ actionLabel }}
        </Button>
      </div>
    </template>
    <p
      v-else
      class="offer-card__message"
      role="status"
    >
      {{ emptyLabel }}
    </p>
  </article>
</template>

<style scoped>
.offer-card {
  min-width: 0;
  overflow: hidden;
  color: var(--foreground, #17202a);
  background: var(--background, #fff);
  border: 1px solid var(--border, #d9dee5);
  border-radius: var(--radius, 0.5rem);
  font-family: inherit;
  overflow-wrap: anywhere;
}
.offer-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
}
.offer-card__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}
.offer-card__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
}
.offer-card__description,
.offer-card__facts {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}
.offer-card__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.offer-card__fact dt {
  color: var(--muted-foreground, #526070);
}
.offer-card__fact dd {
  margin: 0.25rem 0 0;
  font-weight: 600;
}
.offer-card__action {
  width: 100%;
  white-space: normal;
  height: auto;
  min-height: 2.75rem;
}
.offer-card__message {
  margin: 0;
  padding: 1.25rem;
}
</style>
