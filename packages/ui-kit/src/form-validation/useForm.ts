import { computed, ref, unref, watch, type Ref } from 'vue';
import type { UseFormOptions } from './types';

function cloneValue<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T;
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, item]) => { result[key] = cloneValue(item); });
    return result as T;
  }
  return value;
}

function normalizedValue(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map(normalizedValue);
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, item]) => {
      const normalized = normalizedValue(item);
      if (normalized !== undefined) result[key] = normalized;
    });
    return Object.keys(result).length ? result : undefined;
  }
  return value;
}

function equalValues(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => equalValues(item, right[index]));
  }
  if (left && right && typeof left === 'object' && typeof right === 'object') {
    const leftEntries = Object.entries(left);
    const rightRecord = right as Record<string, unknown>;
    return leftEntries.length === Object.keys(rightRecord).length
      && leftEntries.every(([key, value]) => Object.prototype.hasOwnProperty.call(rightRecord, key)
        && equalValues(value, rightRecord[key]));
  }
  return false;
}

export function useForm<T extends Record<string, unknown>>(options: UseFormOptions<T>) {
  const {
    initialValues,
    currentValues,
    compareFn,
    normalize = true,
  } = options;

  const readValue = (value: T | Ref<T> | (() => T)): T => {
    const resolved = typeof value === 'function' ? value() : unref(value);
    return (resolved ?? {}) as T;
  };
  const snapshot = ref<T | undefined>();
  const hasSnapshot = ref(false);
  const makeSnapshot = (value: T) => cloneValue(normalize ? normalizedValue(value) : value) as T;

  watch(
    () => readValue(initialValues),
    (value) => {
      snapshot.value = makeSnapshot(value);
      hasSnapshot.value = true;
    },
    { immediate: true, deep: true },
  );

  const isDirty = computed(() => {
    if (!hasSnapshot.value) return false;
    const current = readValue(currentValues);
    if (compareFn) return !compareFn(snapshot.value as T, current);
    const initial = normalize ? normalizedValue(snapshot.value) : snapshot.value;
    const present = normalize ? normalizedValue(current) : current;
    return !equalValues(initial, present);
  });

  const reset = () => {
    snapshot.value = makeSnapshot(readValue(currentValues));
    hasSnapshot.value = true;
  };
  const updateInitial = (newInitial: T) => {
    snapshot.value = makeSnapshot(newInitial);
    hasSnapshot.value = true;
  };

  return { isDirty, reset, updateInitial };
}
