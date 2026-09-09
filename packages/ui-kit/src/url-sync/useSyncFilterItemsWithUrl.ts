import {
  isReactive,
  isReadonly,
  isRef,
  onMounted,
  onUnmounted,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue';
import {
  ensureLocationChangeHistoryPatched,
  LOCATION_CHANGE_EVENT,
} from './locationChange';
import type {
  UseSyncWithUrlAdapter,
  UseSyncWithUrlNavigationMode,
  UseSyncWithUrlRouteLike,
  UseSyncWithUrlRouteSource,
  UseSyncWithUrlRouterSource,
} from './useSyncWithUrl';

export interface SyncFilterUrlItem {
  value: string;
  options: string[];
  model: string[];
  [key: string]: unknown;
}

interface UseSyncFilterItemsWithUrlOptions<T extends SyncFilterUrlItem> {
  items: MaybeRefOrGetter<readonly T[]>;
  queryKey?: MaybeRefOrGetter<string | undefined>;
  syncToUrl?: MaybeRefOrGetter<boolean | undefined>;
  adapter?: MaybeRefOrGetter<UseSyncWithUrlAdapter | undefined>;
  navigationMode?: MaybeRefOrGetter<UseSyncWithUrlNavigationMode | undefined>;
  route?: UseSyncWithUrlRouteSource;
  router?: UseSyncWithUrlRouterSource;
  onSyncFromUrl?: (items: T[], sourceItems: T[]) => void;
}

const isPlainRouteObject = (value: unknown): value is UseSyncWithUrlRouteLike => (
  typeof value === 'object'
  && value !== null
  && 'query' in value
);

const areArraysEqual = (left: unknown[], right: unknown[]) => {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (!Object.is(left[index], right[index])) {
      return false;
    }
  }

  return true;
};

const normalizeRouterQueryValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => String(item));
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [String(value)];
};

const buildRouterQueryValue = (values: string[]) => {
  if (values.length === 0) {
    return undefined;
  }

  if (values.length === 1) {
    return values[0];
  }

  return [...values];
};

const areRouterQueryValuesEqual = (currentValue: unknown, nextValues: string[]) => {
  const nextQueryValue = buildRouterQueryValue(nextValues);

  if (nextQueryValue === undefined) {
    return currentValue === undefined || currentValue === null;
  }

  if (Array.isArray(nextQueryValue)) {
    return Array.isArray(currentValue)
      && areArraysEqual(normalizeRouterQueryValues(currentValue), nextQueryValue);
  }

  return currentValue === nextQueryValue;
};

export function useSyncFilterItemsWithUrl<T extends SyncFilterUrlItem>({
  items,
  queryKey = 'filter',
  syncToUrl = false,
  adapter = 'auto',
  navigationMode = 'replace',
  route: providedRoute,
  router: providedRouter,
  onSyncFromUrl,
}: UseSyncFilterItemsWithUrlOptions<T>) {
  const isClient = typeof window !== 'undefined';
  const syncedItems = shallowRef<T[]>([]);
  type UrlSyncSnapshot = { sourceItems: T[]; syncedItems: T[] };
  let hasWarnedAdapterFallback = false;
  let hasWarnedNonReactiveRoute = false;
  let isMounted = false;
  let isWritingUrl = false;
  let isListeningToHistory = false;
  let lastNotifiedUrlSync: UrlSyncSnapshot | null = null;
  let lastSuppressedUrlSync: UrlSyncSnapshot | null = null;
  let pendingSelfSyncItems: T[] | null = null;

  const resolveItems = () => toValue(items) ?? [];
  const resolveQueryKey = () => toValue(queryKey) || 'filter';
  const shouldSyncToUrl = () => Boolean(toValue(syncToUrl));
  const resolveAdapterOption = () => toValue(adapter) ?? 'auto';
  const resolveNavigationMode = () => toValue(navigationMode) ?? 'replace';
  const resolveRoute = () => toValue(providedRoute) ?? null;
  const resolveRouter = () => toValue(providedRouter) ?? null;
  const canUseRouter = () => Boolean(resolveRoute() && resolveRouter());
  const resolveAdapter = (): Exclude<UseSyncWithUrlAdapter, 'auto'> => (
    resolveAdapterOption() === 'history'
      ? 'history'
      : canUseRouter() ? 'router' : 'history'
  );

  const cloneItems = (sourceItems: readonly T[] = []) => sourceItems.map((item) => {
    const selectedOptions = new Set(item.model ?? []);

    return {
      ...item,
      options: [...item.options],
      model: item.options.filter((option) => selectedOptions.has(option)),
    };
  }) as T[];

  const areItemsEqual = (left: T[], right: T[]) => {
    if (left.length !== right.length) {
      return false;
    }

    for (let index = 0; index < left.length; index += 1) {
      const leftItem = left[index];
      const rightItem = right[index];

      if (!rightItem) {
        return false;
      }

      const leftKeys = Object.keys(leftItem);
      const rightKeys = Object.keys(rightItem);

      if (leftKeys.length !== rightKeys.length) {
        return false;
      }

      for (let keyIndex = 0; keyIndex < leftKeys.length; keyIndex += 1) {
        const key = leftKeys[keyIndex] as keyof T;

        if (!rightKeys.includes(key as string)) {
          return false;
        }

        const leftValue = leftItem[key];
        const rightValue = rightItem[key];

        if (Array.isArray(leftValue) || Array.isArray(rightValue)) {
          if (!Array.isArray(leftValue) || !Array.isArray(rightValue)) {
            return false;
          }

          if (!areArraysEqual(leftValue, rightValue)) {
            return false;
          }

          continue;
        }

        if (!Object.is(leftValue, rightValue)) {
          return false;
        }
      }
    }

    return true;
  };
  const createUrlSyncSnapshot = (sourceItems: T[], nextItems: T[]): UrlSyncSnapshot => ({
    sourceItems: cloneItems(sourceItems),
    syncedItems: cloneItems(nextItems),
  });
  const areUrlSyncSnapshotsEqual = (
    left: UrlSyncSnapshot | null,
    right: UrlSyncSnapshot,
  ) => (
    left !== null
    && areItemsEqual(left.sourceItems, right.sourceItems)
    && areItemsEqual(left.syncedItems, right.syncedItems)
  );

  const filterQueryKey = (itemValue: string) => `${resolveQueryKey()}-${itemValue}`;

  const warnAdapterFallback = () => {
    if (
      !import.meta.env.DEV
      || hasWarnedAdapterFallback
      || resolveAdapterOption() !== 'router'
      || canUseRouter()
      || !shouldSyncToUrl()
    ) {
      return;
    }

    hasWarnedAdapterFallback = true;
    console.warn(
      `[useSyncFilterItemsWithUrl] Router adapter requested for "${resolveQueryKey()}", but no router and route options were provided. Falling back to the history adapter.`,
    );
  };

  const warnNonReactiveRoute = () => {
    if (
      !import.meta.env.DEV
      || hasWarnedNonReactiveRoute
      || resolveAdapter() !== 'router'
      || !providedRoute
      || typeof providedRoute === 'function'
      || isRef(providedRoute)
      || !isPlainRouteObject(providedRoute)
      || isReactive(providedRoute)
      || isReadonly(providedRoute)
    ) {
      return;
    }

    hasWarnedNonReactiveRoute = true;
    console.warn(
      `[useSyncFilterItemsWithUrl] Router adapter for "${resolveQueryKey()}" expects a reactive route object (for example, useRoute()). A plain object was provided, so external route changes will not be observed.`,
    );
  };

  const readHistoryItems = (sourceItems: T[]) => {
    if (!isClient) {
      return cloneItems(sourceItems);
    }

    const searchParams = new URLSearchParams(window.location.search);

    return sourceItems.map((item) => {
      const selectedOptions = new Set(searchParams.getAll(filterQueryKey(item.value)));

      return {
        ...item,
        options: [...item.options],
        model: item.options.filter((option) => selectedOptions.has(option)),
      };
    }) as T[];
  };

  const readRouterItems = (sourceItems: T[]) => {
    const currentRoute = resolveRoute();

    if (!currentRoute) {
      return cloneItems(sourceItems);
    }

    return sourceItems.map((item) => {
      const selectedOptions = new Set(
        normalizeRouterQueryValues(currentRoute.query[filterQueryKey(item.value)]),
      );

      return {
        ...item,
        options: [...item.options],
        model: item.options.filter((option) => selectedOptions.has(option)),
      };
    }) as T[];
  };

  const readUrlItems = (sourceItems: T[]) => {
    if (!shouldSyncToUrl()) {
      return cloneItems(sourceItems);
    }

    return resolveAdapter() === 'router'
      ? readRouterItems(sourceItems)
      : readHistoryItems(sourceItems);
  };

  const updateHistoryUrlFromItems = (nextItems: T[]) => {
    if (!isClient) {
      return;
    }

    const url = new URL(window.location.href);
    const normalizedItems = cloneItems(nextItems);

    for (let index = 0; index < normalizedItems.length; index += 1) {
      const item = normalizedItems[index];
      const currentQueryKey = filterQueryKey(item.value);

      url.searchParams.delete(currentQueryKey);
      for (let modelIndex = 0; modelIndex < item.model.length; modelIndex += 1) {
        url.searchParams.append(currentQueryKey, item.model[modelIndex]);
      }
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl === currentUrl) {
      return;
    }

    isWritingUrl = true;
    const historyMethod = resolveNavigationMode() === 'push' ? 'pushState' : 'replaceState';
    window.history[historyMethod](window.history.state, '', nextUrl);
    isWritingUrl = false;
  };

  const updateRouterQueryFromItems = (nextItems: T[]) => {
    const currentRouter = resolveRouter();
    const currentRoute = resolveRoute();

    if (!currentRouter || !currentRoute) {
      return;
    }

    const normalizedItems = cloneItems(nextItems);
    const nextQuery = { ...currentRoute.query };
    let hasChanges = false;

    for (let index = 0; index < normalizedItems.length; index += 1) {
      const item = normalizedItems[index];
      const currentQueryKey = filterQueryKey(item.value);
      const nextQueryValue = buildRouterQueryValue(item.model);

      if (!areRouterQueryValuesEqual(currentRoute.query[currentQueryKey], item.model)) {
        hasChanges = true;
      }

      if (nextQueryValue === undefined) {
        delete nextQuery[currentQueryKey];
      } else {
        nextQuery[currentQueryKey] = nextQueryValue;
      }
    }

    if (!hasChanges) {
      return;
    }

    const navigate = resolveNavigationMode() === 'push'
      ? currentRouter.push.bind(currentRouter)
      : currentRouter.replace.bind(currentRouter);

    void navigate({
      hash: currentRoute.hash,
      query: nextQuery,
    });
  };

  const updateUrlFromItems = (nextItems: T[]) => {
    if (!shouldSyncToUrl()) {
      return;
    }

    if (resolveAdapter() === 'router') {
      updateRouterQueryFromItems(nextItems);
      return;
    }

    updateHistoryUrlFromItems(nextItems);
  };

  const syncFromSourceItems = () => {
    const sourceItems = cloneItems(resolveItems());
    const nextItems = readUrlItems(sourceItems);
    const isPendingSelfSync = pendingSelfSyncItems !== null
      && areItemsEqual(pendingSelfSyncItems, nextItems);

    if (!areItemsEqual(syncedItems.value, nextItems)) {
      syncedItems.value = nextItems;
    }

    updateUrlFromItems(nextItems);

    if (areItemsEqual(sourceItems, nextItems)) {
      lastNotifiedUrlSync = null;
      lastSuppressedUrlSync = null;
      pendingSelfSyncItems = null;
      return;
    }

    if (!shouldSyncToUrl()) {
      lastNotifiedUrlSync = null;
      lastSuppressedUrlSync = null;
      pendingSelfSyncItems = null;
      return;
    }

    const currentUrlSync = createUrlSyncSnapshot(sourceItems, nextItems);

    if (isPendingSelfSync) {
      pendingSelfSyncItems = null;
      lastSuppressedUrlSync = currentUrlSync;
      return;
    }

    if (areUrlSyncSnapshotsEqual(lastSuppressedUrlSync, currentUrlSync)) {
      return;
    }

    lastSuppressedUrlSync = null;

    if (areUrlSyncSnapshotsEqual(lastNotifiedUrlSync, currentUrlSync)) {
      return;
    }

    lastNotifiedUrlSync = currentUrlSync;

    onSyncFromUrl?.(cloneItems(nextItems), sourceItems);
  };

  const setItems = (nextItems: T[]) => {
    const normalizedItems = cloneItems(nextItems);

    syncedItems.value = normalizedItems;
    pendingSelfSyncItems = shouldSyncToUrl() && resolveAdapter() === 'router'
      ? normalizedItems
      : null;
    updateUrlFromItems(normalizedItems);
  };

  const syncHistoryItems = () => {
    if (!isClient || !shouldSyncToUrl() || resolveAdapter() !== 'history' || isWritingUrl) {
      return;
    }

    syncFromSourceItems();
  };

  const addHistoryListeners = () => {
    if (!isClient || isListeningToHistory) {
      return;
    }

    ensureLocationChangeHistoryPatched();
    window.addEventListener('popstate', syncHistoryItems);
    window.addEventListener(LOCATION_CHANGE_EVENT, syncHistoryItems);
    isListeningToHistory = true;
  };

  const removeHistoryListeners = () => {
    if (!isClient || !isListeningToHistory) {
      return;
    }

    window.removeEventListener('popstate', syncHistoryItems);
    window.removeEventListener(LOCATION_CHANGE_EVENT, syncHistoryItems);
    isListeningToHistory = false;
  };

  const syncHistoryListenerState = () => {
    if (!isMounted) {
      return;
    }

    if (shouldSyncToUrl() && resolveAdapter() === 'history') {
      addHistoryListeners();
      return;
    }

    removeHistoryListeners();
  };

  watch(() => resolveItems(), () => {
    syncFromSourceItems();
  }, { immediate: true, deep: true });

  watch(() => resolveQueryKey(), () => {
    syncFromSourceItems();
  });

  watch(() => resolveAdapter(), () => {
    warnAdapterFallback();
    warnNonReactiveRoute();
    syncHistoryListenerState();
    syncFromSourceItems();
  }, { immediate: true });

  watch(() => shouldSyncToUrl(), () => {
    syncHistoryListenerState();
    syncFromSourceItems();
  });

  watch(() => (
    resolveAdapter() === 'router'
      ? resolveItems().map((item) => {
        const currentRoute = resolveRoute();
        const currentValue = currentRoute?.query[filterQueryKey(item.value)];

        if (Array.isArray(currentValue)) {
          return [...currentValue];
        }

        return currentValue ?? null;
      })
      : null
  ), () => {
    if (!shouldSyncToUrl() || resolveAdapter() !== 'router') {
      return;
    }

    syncFromSourceItems();
  }, { immediate: true, deep: true });

  onMounted(() => {
    isMounted = true;
    syncHistoryListenerState();
  });

  onUnmounted(() => {
    removeHistoryListeners();
  });

  return {
    areItemsEqual,
    cloneItems,
    items: syncedItems,
    setItems,
  };
}
