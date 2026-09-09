import {
  customRef,
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

export type UseSyncWithUrlAdapter = 'auto' | 'history' | 'router';
export type UseSyncWithUrlNavigationMode = 'push' | 'replace';
export type UseSyncWithUrlRouteLike = {
  hash?: string;
  query: Record<string, unknown>;
};

export type UseSyncWithUrlRouterLocation = {
  hash?: string;
  query?: Record<string, unknown>;
};

export type UseSyncWithUrlRouterLike = {
  push: (location: UseSyncWithUrlRouterLocation) => unknown;
  replace: (location: UseSyncWithUrlRouterLocation) => unknown;
};

export type UseSyncWithUrlRouteSource = MaybeRefOrGetter<UseSyncWithUrlRouteLike | null | undefined>;
export type UseSyncWithUrlRouterSource = MaybeRefOrGetter<UseSyncWithUrlRouterLike | null | undefined>;

interface UseSyncWithUrlBaseOptions<T> {
  key: string;
  defaultValue: T;
  syncToUrl?: boolean;
  equals?: UseSyncWithUrlEqualityFn<T>;
  adapter?: UseSyncWithUrlAdapter;
  navigationMode?: UseSyncWithUrlNavigationMode;
  route?: UseSyncWithUrlRouteSource;
  router?: UseSyncWithUrlRouterSource;
}

type UseSyncWithUrlParser<T> = (val: string | null) => T;
type UseSyncWithUrlSerializer<T> = (val: T) => string;
type UseSyncWithUrlEqualityFn<T> = (left: T, right: T) => boolean;

export type UseSyncWithUrlOptions<T = string> = UseSyncWithUrlBaseOptions<T> & (
  [T] extends [string]
    ? {
      parse?: UseSyncWithUrlParser<T>;
      serialize?: UseSyncWithUrlSerializer<T>;
    }
    : {
      parse: UseSyncWithUrlParser<T>;
      serialize: UseSyncWithUrlSerializer<T>;
    }
);

const buildRelativeUrl = (url: URL) => `${url.pathname}${url.search}${url.hash}`;
const isPlainRouteObject = (value: unknown): value is UseSyncWithUrlRouteLike => (
  typeof value === 'object'
  && value !== null
  && 'query' in value
);

const normalizeQueryValue = (
  key: string,
  value: unknown,
  onMultipleValues?: () => void,
): string | null => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }

    if (value.length > 1) {
      onMultipleValues?.();
    }

    return normalizeQueryValue(key, value[0] ?? null, onMultipleValues);
  }

  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
};

/**
 * Syncs a reactive value with the URL query parameter.
 */
export function useSyncWithUrl<T = string>({
  key,
  defaultValue,
  syncToUrl = true,
  equals,
  adapter = 'auto',
  navigationMode = 'replace',
  parse,
  route: providedRoute,
  router: providedRouter,
  serialize,
}: UseSyncWithUrlOptions<T>) {
  const isClient = typeof window !== 'undefined';
  const areEqual: UseSyncWithUrlEqualityFn<T> = equals ?? ((left, right) => Object.is(left, right));
  const resolveRoute = () => toValue(providedRoute) ?? null;
  const resolveRouter = () => toValue(providedRouter) ?? null;
  const canUseRouter = () => Boolean(resolveRoute() && resolveRouter());
  const resolveAdapter = (): Exclude<UseSyncWithUrlAdapter, 'auto'> => (
    adapter === 'history'
      ? 'history'
      : canUseRouter() ? 'router' : 'history'
  );
  let hasWarnedMultipleHistoryValues = false;
  let hasWarnedMultipleRouterValues = false;
  let hasWarnedAdapterFallback = false;
  let hasWarnedNonReactiveRoute = false;
  let isMounted = false;
  let isListeningToHistory = false;
  let currentState = defaultValue;
  const state = customRef<T>((track, trigger) => ({
    get() {
      track();
      return currentState;
    },
    set(nextValue) {
      if (areEqual(currentState, nextValue)) {
        return;
      }

      currentState = nextValue;
      trigger();
    },
  }));
  const readHistoryQueryValue = () => (
    isClient
      ? normalizeQueryValue(
        key,
        new URLSearchParams(window.location.search).getAll(key),
        () => {
          if (!import.meta.env.DEV || hasWarnedMultipleHistoryValues) {
            return;
          }

          hasWarnedMultipleHistoryValues = true;
          console.warn(
            `[useSyncWithUrl] Query parameter "${key}" has multiple values in history mode. Using the first value and normalizing the URL.`,
          );
        },
      )
      : null
  );
  const readRouterQueryValue = () => {
    const currentRoute = resolveRoute();

    return currentRoute
      ? normalizeQueryValue(key, currentRoute.query[key], () => {
        if (!import.meta.env.DEV || hasWarnedMultipleRouterValues) {
          return;
        }

        hasWarnedMultipleRouterValues = true;
        console.warn(
          `[useSyncWithUrl] Query parameter "${key}" has multiple values in router mode. Using the first value and normalizing the URL.`,
        );
      })
      : null;
  };
  const readQueryValue = () => (
    resolveAdapter() === 'router'
      ? readRouterQueryValue()
      : readHistoryQueryValue()
  );
  const queryValue = shallowRef<string | null>(readQueryValue());

  const warnParseError = (value: string | null, error: unknown) => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.warn(
      `[useSyncWithUrl] Failed to parse query parameter "${key}" with value "${value ?? 'null'}". Falling back to the default value.`,
      error,
    );
  };
  const warnAdapterFallback = () => {
    if (
      !import.meta.env.DEV
      || hasWarnedAdapterFallback
      || adapter !== 'router'
      || canUseRouter()
      || !syncToUrl
    ) {
      return;
    }

    hasWarnedAdapterFallback = true;
    console.warn(
      `[useSyncWithUrl] Router adapter requested for "${key}", but no router and route options were provided. Falling back to the history adapter.`,
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
      `[useSyncWithUrl] Router adapter for "${key}" expects a reactive route object (for example, useRoute()). A plain object was provided, so external route changes will not be observed.`,
    );
  };

  const serializeQueryValue = (value: T) => (
    serialize ? serialize(value) : String(value)
  );
  const defaultSerializedValue = serializeQueryValue(defaultValue);

  const parseQueryValue = (value: string | null) => {
    if (value === null) {
      return defaultValue;
    }

    try {
      return parse ? (parse(value) ?? defaultValue) : (value as T);
    } catch (error) {
      warnParseError(value, error);
      return defaultValue;
    }
  };
  const resolveNavigationMode = (): UseSyncWithUrlNavigationMode => navigationMode;
  const updateRouterQuery = (value: T) => {
    const currentRouter = resolveRouter();
    const currentRoute = resolveRoute();

    if (!syncToUrl || !currentRouter || !currentRoute) {
      return;
    }

    const serializedValue = serializeQueryValue(value);
    const currentValue = readRouterQueryValue();
    const hasRepeatedValues = Array.isArray(currentRoute.query[key]) && currentRoute.query[key].length > 1;
    const shouldRemoveParam = serializedValue === defaultSerializedValue;

    if (!hasRepeatedValues && (shouldRemoveParam ? currentValue === null : currentValue === serializedValue)) {
      return;
    }

    const nextQuery = { ...currentRoute.query };

    if (shouldRemoveParam) {
      delete nextQuery[key];
    } else {
      nextQuery[key] = serializedValue;
    }

    const navigate = resolveNavigationMode() === 'push'
      ? currentRouter.push.bind(currentRouter)
      : currentRouter.replace.bind(currentRouter);

    void navigate({
      hash: currentRoute.hash,
      query: nextQuery,
    });
  };

  const updateUrl = (value: T) => {
    if (!syncToUrl) return;

    if (resolveAdapter() === 'router') {
      updateRouterQuery(value);
      return;
    }

    if (!isClient) return;

    const url = new URL(window.location.href);
    const serializedValue = serializeQueryValue(value);
    const currentValues = url.searchParams.getAll(key);
    const currentValue = currentValues[0] ?? null;
    const hasRepeatedValues = currentValues.length > 1;
    const shouldRemoveParam = serializedValue === defaultSerializedValue;

    if (!hasRepeatedValues && (shouldRemoveParam ? currentValue === null : currentValue === serializedValue)) {
      return;
    }

    if (shouldRemoveParam) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, serializedValue);
    }

    const historyMethod = resolveNavigationMode() === 'push' ? 'pushState' : 'replaceState';
    window.history[historyMethod](window.history.state, '', buildRelativeUrl(url));
  };

  const syncHistoryQueryValue = () => {
    if (!isClient || !syncToUrl || resolveAdapter() !== 'history') return;

    queryValue.value = readHistoryQueryValue();
  };

  const addHistoryListeners = () => {
    if (!isClient || isListeningToHistory) {
      return;
    }

    ensureLocationChangeHistoryPatched();
    window.addEventListener('popstate', syncHistoryQueryValue);
    window.addEventListener(LOCATION_CHANGE_EVENT, syncHistoryQueryValue);
    isListeningToHistory = true;
  };

  const removeHistoryListeners = () => {
    if (!isClient || !isListeningToHistory) {
      return;
    }

    window.removeEventListener('popstate', syncHistoryQueryValue);
    window.removeEventListener(LOCATION_CHANGE_EVENT, syncHistoryQueryValue);
    isListeningToHistory = false;
  };

  const syncHistoryListenerState = () => {
    if (!isMounted) {
      return;
    }

    if (syncToUrl && resolveAdapter() === 'history') {
      addHistoryListeners();
      return;
    }

    removeHistoryListeners();
  };

  warnAdapterFallback();
  warnNonReactiveRoute();

  onMounted(() => {
    isMounted = true;
    syncHistoryListenerState();

    if (!syncToUrl) {
      return;
    }

    if (resolveAdapter() === 'history') {
      syncHistoryQueryValue();
      return;
    }

    queryValue.value = readRouterQueryValue();
  });

  onUnmounted(() => {
    removeHistoryListeners();
  });

  watch(() => resolveAdapter(), () => {
    warnAdapterFallback();
    warnNonReactiveRoute();

    if (!syncToUrl) {
      return;
    }

    syncHistoryListenerState();
    queryValue.value = readQueryValue();
  }, { immediate: true });

  watch(
    () => (resolveAdapter() === 'router' ? readRouterQueryValue() : null),
    (newQuery) => {
      if (!syncToUrl || resolveAdapter() !== 'router') {
        return;
      }

      queryValue.value = newQuery;
    },
    { immediate: true },
  );

  watch(state, (newVal) => {
    updateUrl(newVal);
  });

  watch(queryValue, (newQuery) => {
    if (!syncToUrl) {
      return;
    }

    const nextValue = parseQueryValue(newQuery);
    const shouldUpdateState = !areEqual(currentState, nextValue);

    if (shouldUpdateState) {
      state.value = nextValue;
      return;
    }

    updateUrl(nextValue);
  }, { immediate: true });

  return state;
}
