/* eslint-disable vue/one-component-per-file */

import { flushPromises, mount } from '@vue/test-utils';
import {
  defineComponent,
  nextTick,
  reactive,
  ref,
  type Ref,
} from 'vue';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import {
  useSyncWithUrl,
  type UseSyncWithUrlRouteLike,
  type UseSyncWithUrlRouterLike,
  type UseSyncWithUrlOptions,
} from '../useSyncWithUrl';

const mountComposable = <T>(options: UseSyncWithUrlOptions<T>) => {
  let state!: Ref<T>;

  const wrapper = mount(defineComponent({
    setup() {
      state = useSyncWithUrl(options);
      return () => null;
    },
  }));

  return { wrapper, state };
};

const mountComposableWithRouter = async <T>(
  options: UseSyncWithUrlOptions<T>,
  initialUrl = '/dashboard',
) => {
  let state!: Ref<T>;
  const initialQuery = Object.fromEntries(new URLSearchParams(initialUrl.split('?')[1] ?? ''));
  const route = reactive<UseSyncWithUrlRouteLike>({
    hash: '',
    query: initialQuery,
  });
  const applyLocation = (location: { hash?: string; query?: Record<string, unknown> }) => {
    route.hash = location.hash ?? '';
    route.query = { ...(location.query ?? {}) };
  };
  const router: UseSyncWithUrlRouterLike = {
    push: vi.fn((location) => {
      applyLocation(location);
      return Promise.resolve();
    }),
    replace: vi.fn((location) => {
      applyLocation(location);
      return Promise.resolve();
    }),
  };

  const wrapper = mount(defineComponent({
    setup() {
      state = useSyncWithUrl({
        ...options,
        route,
        router,
      });
      return () => null;
    },
  }));

  return { wrapper, state, route, router };
};

const flushWatchers = async () => {
  await nextTick();
  await nextTick();
};

const flushAsyncEffects = async () => {
  await flushPromises();
  await flushWatchers();
};

const createAsyncRouterStub = (route: UseSyncWithUrlRouteLike) => {
  const pendingUpdates: Array<() => void> = [];
  const applyLocation = (location: { hash?: string; query?: Record<string, unknown> }) => {
    route.hash = location.hash ?? '';
    route.query = { ...(location.query ?? {}) };
  };
  const router: UseSyncWithUrlRouterLike = {
    push: vi.fn((location) => new Promise<void>((resolve) => {
      pendingUpdates.push(() => {
        applyLocation(location);
        resolve();
      });
    })),
    replace: vi.fn((location) => new Promise<void>((resolve) => {
      pendingUpdates.push(() => {
        applyLocation(location);
        resolve();
      });
    })),
  };

  return {
    router,
    flushPendingUpdates: async () => {
      while (pendingUpdates.length > 0) {
        const update = pendingUpdates.shift();
        update?.();
      }

      await flushAsyncEffects();
    },
  };
};

const assertComposableTypes = () => {
  const stringState = useSyncWithUrl({
    key: 'tab',
    defaultValue: '',
  });

  expectTypeOf(stringState.value).toEqualTypeOf<string>();

  const numberState = useSyncWithUrl({
    key: 'page',
    defaultValue: 1,
    parse: (value) => Number(value ?? 1),
    serialize: (value) => String(value),
  });

  expectTypeOf(numberState.value).toEqualTypeOf<number>();

  // @ts-expect-error Non-string values must provide parse and serialize functions.
  useSyncWithUrl({
    key: 'page',
    defaultValue: 1,
  });
};

void assertComposableTypes;

describe('useSyncWithUrl', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('syncs state from query updates triggered by history navigation', async () => {
    const { wrapper, state } = mountComposable({
      key: 'tab',
      defaultValue: '',
    });

    expect(state.value).toBe('');

    window.history.pushState({}, '', '/dashboard?tab=wallet');
    await flushWatchers();

    expect(state.value).toBe('wallet');

    window.history.replaceState({}, '', '/dashboard?tab=portfolio');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await flushWatchers();

    expect(state.value).toBe('portfolio');

    wrapper.unmount();
  });

  it('removes default-valued query params without clearing history state', async () => {
    const historyState = { preserve: 'me' };

    window.history.replaceState(historyState, '', '/dashboard?tab=');

    const { wrapper, state } = mountComposable({
      key: 'tab',
      defaultValue: '',
    });

    await flushWatchers();

    expect(state.value).toBe('');
    expect(window.location.search).toBe('');
    expect(window.history.state).toEqual(historyState);

    state.value = 'wallet';
    await flushWatchers();

    expect(window.location.search).toBe('?tab=wallet');
    expect(window.history.state).toEqual(historyState);

    state.value = '';
    await flushWatchers();

    expect(window.location.search).toBe('');
    expect(window.history.state).toEqual(historyState);

    wrapper.unmount();
  });

  it('warns about duplicate history query params and normalizes them to a single value', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    window.history.replaceState({}, '', '/dashboard?tab=wallet&tab=portfolio');

    const { wrapper, state } = mountComposable({
      key: 'tab',
      defaultValue: '',
    });

    await flushWatchers();

    expect(state.value).toBe('wallet');
    expect(window.location.search).toBe('?tab=wallet');
    expect(warnSpy).toHaveBeenCalledTimes(import.meta.env.DEV ? 1 : 0);

    if (import.meta.env.DEV) {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('has multiple values in history mode'),
      );
    }

    wrapper.unmount();
  });

  it('warns in development, falls back to the default value, and cleans the URL when parsing fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    window.history.replaceState({}, '', '/dashboard?page=bad');

    const { wrapper, state } = mountComposable<number>({
      key: 'page',
      defaultValue: 1,
      parse: (value) => {
        const parsedValue = Number(value);

        if (!Number.isInteger(parsedValue) || parsedValue < 1) {
          throw new Error('Invalid page');
        }

        return parsedValue;
      },
      serialize: (value) => String(value),
    });

    await flushWatchers();

    expect(state.value).toBe(1);
    expect(window.location.search).toBe('');

    expect(warnSpy).toHaveBeenCalledTimes(import.meta.env.DEV ? 1 : 0);

    if (import.meta.env.DEV) {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse query parameter "page"'),
        expect.any(Error),
      );
    }

    wrapper.unmount();
  });

  it('does not call a custom parser when the query parameter is missing', async () => {
    const parseSpy = vi.fn((value: string | null) => Number(value ?? 1));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { wrapper, state } = mountComposable<number>({
      key: 'page',
      defaultValue: 1,
      parse: parseSpy,
      serialize: (value) => String(value),
    });

    await flushWatchers();

    expect(state.value).toBe(1);
    expect(parseSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('preserves object state when equivalent values are provided', async () => {
    window.history.replaceState({}, '', '/dashboard?page=2');

    const { wrapper, state } = mountComposable<{ page: number }>({
      key: 'page',
      defaultValue: { page: 1 },
      parse: (value) => ({ page: Number(value ?? 1) }),
      serialize: (value) => String(value.page),
      equals: (left, right) => left.page === right.page,
    });

    await flushWatchers();

    expect(state.value).toEqual({ page: 2 });
    const currentReference = state.value;

    window.history.pushState({}, '', '/dashboard?page=02');
    await flushWatchers();

    expect(state.value).toBe(currentReference);
    expect(window.location.search).toBe('?page=2');

    state.value = { page: 2 };
    await flushWatchers();

    expect(state.value).toBe(currentReference);

    wrapper.unmount();
  });

  it('keeps state local when URL syncing is disabled', async () => {
    window.history.replaceState({}, '', '/dashboard?tab=wallet');

    const { wrapper, state } = mountComposable({
      key: 'tab',
      defaultValue: 'overview',
      syncToUrl: false,
    });

    await flushWatchers();

    expect(state.value).toBe('overview');
    expect(window.location.search).toBe('?tab=wallet');

    state.value = 'portfolio';
    await flushWatchers();

    expect(state.value).toBe('portfolio');
    expect(window.location.search).toBe('?tab=wallet');

    window.history.pushState({}, '', '/dashboard?tab=settings');
    await flushWatchers();

    expect(state.value).toBe('portfolio');
    expect(window.location.search).toBe('?tab=settings');

    wrapper.unmount();
  });

  it('uses the router adapter when router and route options are provided', async () => {
    const { wrapper, state, route, router } = await mountComposableWithRouter({
      key: 'tab',
      defaultValue: '',
    }, '/dashboard?tab=wallet');

    await flushAsyncEffects();

    expect(state.value).toBe('wallet');

    await router.replace({ query: { tab: 'portfolio' } });
    await flushAsyncEffects();

    expect(state.value).toBe('portfolio');

    state.value = 'settings';
    await flushAsyncEffects();

    expect(route.query.tab).toBe('settings');

    state.value = '';
    await flushAsyncEffects();

    expect(route.query.tab).toBeUndefined();

    wrapper.unmount();
  });

  it('switches from the history fallback to router mode when router dependencies become available later', async () => {
    const routeRef = ref<UseSyncWithUrlRouteLike | null>(null);
    const routerRef = ref<UseSyncWithUrlRouterLike | null>(null);
    const route = reactive<UseSyncWithUrlRouteLike>({
      hash: '#wallet',
      query: { tab: 'router' },
    });
    const router: UseSyncWithUrlRouterLike = {
      push: vi.fn((location) => {
        route.hash = location.hash ?? '';
        route.query = { ...(location.query ?? {}) };
        return Promise.resolve();
      }),
      replace: vi.fn((location) => {
        route.hash = location.hash ?? '';
        route.query = { ...(location.query ?? {}) };
        return Promise.resolve();
      }),
    };

    window.history.replaceState({}, '', '/dashboard?tab=history');

    let state!: Ref<string>;
    const wrapper = mount(defineComponent({
      setup() {
        state = useSyncWithUrl({
          key: 'tab',
          defaultValue: '',
          adapter: 'router',
          route: routeRef,
          router: routerRef,
        });

        return () => null;
      },
    }));

    await flushAsyncEffects();

    expect(state.value).toBe('history');

    routeRef.value = route;
    routerRef.value = router;
    await flushAsyncEffects();

    expect(state.value).toBe('router');

    state.value = 'settings';
    await flushAsyncEffects();

    expect(route.query.tab).toBe('settings');
    expect(router.replace).toHaveBeenCalled();

    wrapper.unmount();
  });

  it('normalizes router query values with a single navigation even when navigation resolves asynchronously', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const route = reactive<UseSyncWithUrlRouteLike>({
      hash: '',
      query: { page: ['02', '03'] },
    });
    const { router, flushPendingUpdates } = createAsyncRouterStub(route);

    let state!: Ref<number>;
    const wrapper = mount(defineComponent({
      setup() {
        state = useSyncWithUrl<number>({
          key: 'page',
          defaultValue: 1,
          parse: (value) => Number(value ?? 1),
          serialize: (value) => String(value),
          route,
          router,
        });

        return () => null;
      },
    }));

    await flushWatchers();

    expect(state.value).toBe(2);
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(import.meta.env.DEV ? 1 : 0);

    if (import.meta.env.DEV) {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('has multiple values in router mode'),
      );
    }

    await flushPendingUpdates();

    expect(route.query.page).toBe('2');

    wrapper.unmount();
  });

  it('falls back to history when router mode is requested without vue-router', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    window.history.replaceState({}, '', '/dashboard?tab=wallet');

    const { wrapper, state } = mountComposable({
      key: 'tab',
      defaultValue: '',
      adapter: 'router',
    });

    await flushWatchers();

    expect(state.value).toBe('wallet');
    expect(warnSpy).toHaveBeenCalledTimes(import.meta.env.DEV ? 1 : 0);

    if (import.meta.env.DEV) {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('no router and route options were provided'),
      );
    }

    state.value = 'portfolio';
    await flushWatchers();

    expect(window.location.search).toBe('?tab=portfolio');

    wrapper.unmount();
  });

  it('warns when router mode receives a non-reactive route object', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const route: UseSyncWithUrlRouteLike = {
      hash: '',
      query: { tab: 'wallet' },
    };
    const router: UseSyncWithUrlRouterLike = {
      push: vi.fn(() => Promise.resolve()),
      replace: vi.fn(() => Promise.resolve()),
    };

    const { wrapper, state } = mountComposable({
      key: 'tab',
      defaultValue: '',
      adapter: 'router',
      route,
      router,
    });

    await flushWatchers();

    expect(state.value).toBe('wallet');
    expect(warnSpy).toHaveBeenCalledTimes(import.meta.env.DEV ? 1 : 0);

    if (import.meta.env.DEV) {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('expects a reactive route object'),
      );
    }

    wrapper.unmount();
  });
});
