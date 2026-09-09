import { flushPromises, mount } from '@vue/test-utils';
import {
  defineComponent,
  nextTick,
  reactive,
  ref,
  type Ref,
} from 'vue';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  useSyncFilterItemsWithUrl,
  type SyncFilterUrlItem,
} from '../useSyncFilterItemsWithUrl';
import type {
  UseSyncWithUrlAdapter,
  UseSyncWithUrlRouteLike,
  UseSyncWithUrlRouterLike,
} from '../useSyncWithUrl';

interface TestFilterItem extends SyncFilterUrlItem {
  title: string;
}

const buildFilter = (overrides: Partial<TestFilterItem> = {}): TestFilterItem => ({
  value: 'status',
  title: 'By status:',
  options: ['Success', 'Pending'],
  model: [],
  ...overrides,
});

const flushWatchers = async () => {
  await nextTick();
  await nextTick();
};

const flushAsyncEffects = async () => {
  await flushPromises();
  await flushWatchers();
};

const mountComposable = ({
  initialItems = [buildFilter()],
  initialQueryKey = 'filter',
  initialSyncToUrl = true,
  initialAdapter = 'auto',
  initialRoute = null,
  initialRouter = null,
}: {
  initialItems?: TestFilterItem[];
  initialQueryKey?: string;
  initialSyncToUrl?: boolean;
  initialAdapter?: UseSyncWithUrlAdapter;
  initialRoute?: UseSyncWithUrlRouteLike | null;
  initialRouter?: UseSyncWithUrlRouterLike | null;
} = {}) => {
  let syncedItems!: Ref<TestFilterItem[]>;
  let setItems!: (items: TestFilterItem[]) => void;
  const items = ref(initialItems);
  const queryKey = ref(initialQueryKey);
  const syncToUrl = ref(initialSyncToUrl);
  const adapter = ref(initialAdapter);
  const route = ref<UseSyncWithUrlRouteLike | null>(initialRoute);
  const router = ref<UseSyncWithUrlRouterLike | null>(initialRouter);
  const onSyncFromUrl = vi.fn();

  const wrapper = mount(defineComponent({
    setup() {
      const composable = useSyncFilterItemsWithUrl<TestFilterItem>({
        items,
        queryKey,
        syncToUrl,
        adapter,
        route,
        router,
        onSyncFromUrl,
      });

      syncedItems = composable.items as Ref<TestFilterItem[]>;
      setItems = composable.setItems;

      return () => null;
    },
  }));

  return {
    wrapper,
    items,
    onSyncFromUrl,
    queryKey,
    adapter,
    route,
    router,
    setItems,
    syncToUrl,
    syncedItems,
  };
};

describe('useSyncFilterItemsWithUrl', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('hydrates multi-select filter values from the URL and canonicalizes invalid values', async () => {
    window.history.replaceState(
      {},
      '',
      '/dashboard?portfolio-filter-status=Pending&portfolio-filter-status=Unknown',
    );

    const { wrapper, syncedItems, onSyncFromUrl } = mountComposable({
      initialItems: [buildFilter()],
      initialQueryKey: 'portfolio-filter',
    });

    await flushWatchers();

    expect(syncedItems.value).toEqual([
      buildFilter({ model: ['Pending'] }),
    ]);
    expect(window.location.search).toBe('?portfolio-filter-status=Pending');
    expect(onSyncFromUrl).toHaveBeenCalledWith(
      [buildFilter({ model: ['Pending'] })],
      [buildFilter()],
    );

    wrapper.unmount();
  });

  it('writes repeated query params while preserving unrelated search params', async () => {
    window.history.replaceState({}, '', '/dashboard?tab=all');

    const { wrapper, setItems } = mountComposable({
      initialItems: [
        buildFilter({ options: ['Read', 'Unread'] }),
        buildFilter({
          value: 'type',
          title: 'By tag:',
          options: ['Wallet', 'System'],
        }),
      ],
      initialQueryKey: 'notification-filter',
    });

    await flushWatchers();

    setItems([
      buildFilter({ options: ['Read', 'Unread'], model: ['Unread'] }),
      buildFilter({
        value: 'type',
        title: 'By tag:',
        options: ['Wallet', 'System'],
        model: ['Wallet'],
      }),
    ]);
    await flushWatchers();

    expect(window.location.search).toBe(
      '?tab=all&notification-filter-status=Unread&notification-filter-type=Wallet',
    );

    wrapper.unmount();
  });

  it('re-emits a revisited URL state after a self-authored write when source items are still stale', async () => {
    const {
      wrapper,
      onSyncFromUrl,
      setItems,
      syncedItems,
    } = mountComposable({
      initialItems: [buildFilter()],
      initialQueryKey: 'wallet-filter',
    });

    await flushWatchers();

    setItems([buildFilter({ model: ['Pending'] })]);
    await flushWatchers();

    expect(window.location.search).toBe('?wallet-filter-status=Pending');
    expect(onSyncFromUrl).not.toHaveBeenCalled();

    window.history.replaceState({}, '', '/dashboard?wallet-filter-status=Success');
    await flushWatchers();

    expect(syncedItems.value).toEqual([
      buildFilter({ model: ['Success'] }),
    ]);
    expect(onSyncFromUrl).toHaveBeenCalledTimes(1);
    expect(onSyncFromUrl).toHaveBeenLastCalledWith(
      [buildFilter({ model: ['Success'] })],
      [buildFilter()],
    );

    window.history.replaceState({}, '', '/dashboard?wallet-filter-status=Pending');
    await flushWatchers();

    expect(syncedItems.value).toEqual([
      buildFilter({ model: ['Pending'] }),
    ]);
    expect(onSyncFromUrl).toHaveBeenCalledTimes(2);
    expect(onSyncFromUrl).toHaveBeenLastCalledWith(
      [buildFilter({ model: ['Pending'] })],
      [buildFilter()],
    );

    wrapper.unmount();
  });

  it('reacts to later history navigation changes', async () => {
    const { wrapper, syncedItems, onSyncFromUrl } = mountComposable({
      initialItems: [buildFilter()],
      initialQueryKey: 'distribution-filter',
    });

    await flushWatchers();

    window.history.replaceState({}, '', '/dashboard?distribution-filter-status=Pending');
    await flushWatchers();

    expect(syncedItems.value).toEqual([
      buildFilter({ model: ['Pending'] }),
    ]);
    expect(onSyncFromUrl).toHaveBeenCalledWith(
      [buildFilter({ model: ['Pending'] })],
      [buildFilter()],
    );

    wrapper.unmount();
  });

  it('keeps source items local until URL sync is enabled', async () => {
    window.history.replaceState({}, '', '/dashboard?wallet-filter-status=Pending');

    const {
      wrapper,
      onSyncFromUrl,
      syncedItems,
      syncToUrl,
    } = mountComposable({
      initialItems: [buildFilter()],
      initialQueryKey: 'wallet-filter',
      initialSyncToUrl: false,
    });

    await flushWatchers();

    expect(syncedItems.value).toEqual([buildFilter()]);
    expect(onSyncFromUrl).not.toHaveBeenCalled();

    syncToUrl.value = true;
    await flushWatchers();

    expect(syncedItems.value).toEqual([
      buildFilter({ model: ['Pending'] }),
    ]);
    expect(onSyncFromUrl).toHaveBeenCalledWith(
      [buildFilter({ model: ['Pending'] })],
      [buildFilter()],
    );

    wrapper.unmount();
  });

  it('syncs repeated filter query values with the router adapter and canonicalizes them', async () => {
    const route = reactive<UseSyncWithUrlRouteLike>({
      hash: '#filters',
      query: {
        tab: 'all',
        'portfolio-filter-status': ['Pending', 'Unknown'],
      },
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

    const { wrapper, syncedItems, onSyncFromUrl } = mountComposable({
      initialItems: [buildFilter()],
      initialQueryKey: 'portfolio-filter',
      initialAdapter: 'router',
      initialRoute: route,
      initialRouter: router,
    });

    await flushAsyncEffects();

    expect(syncedItems.value).toEqual([
      buildFilter({ model: ['Pending'] }),
    ]);
    expect(route.query['portfolio-filter-status']).toBe('Pending');
    expect(route.query.tab).toBe('all');
    expect(onSyncFromUrl).toHaveBeenCalledWith(
      [buildFilter({ model: ['Pending'] })],
      [buildFilter()],
    );

    wrapper.unmount();
  });

  it('switches from history fallback to router mode and does not re-emit its own router writes', async () => {
    const routeObject = reactive<UseSyncWithUrlRouteLike>({
      hash: '#wallet',
      query: { 'wallet-filter-status': 'Pending' },
    });
    const routerObject: UseSyncWithUrlRouterLike = {
      push: vi.fn((location) => {
        routeObject.hash = location.hash ?? '';
        routeObject.query = { ...(location.query ?? {}) };
        return Promise.resolve();
      }),
      replace: vi.fn((location) => {
        routeObject.hash = location.hash ?? '';
        routeObject.query = { ...(location.query ?? {}) };
        return Promise.resolve();
      }),
    };

    window.history.replaceState({}, '', '/dashboard?wallet-filter-status=Success');

    const {
      wrapper,
      onSyncFromUrl,
      route,
      router,
      setItems,
      syncedItems,
    } = mountComposable({
      initialItems: [buildFilter()],
      initialQueryKey: 'wallet-filter',
      initialAdapter: 'router',
    });

    await flushAsyncEffects();

    expect(syncedItems.value).toEqual([
      buildFilter({ model: ['Success'] }),
    ]);

    route.value = routeObject;
    router.value = routerObject;
    await flushAsyncEffects();

    expect(syncedItems.value).toEqual([
      buildFilter({ model: ['Pending'] }),
    ]);
    expect(onSyncFromUrl).toHaveBeenCalledTimes(2);
    expect(onSyncFromUrl).toHaveBeenLastCalledWith(
      [buildFilter({ model: ['Pending'] })],
      [buildFilter()],
    );

    setItems([buildFilter({ model: ['Success'] })]);
    await flushAsyncEffects();

    expect(routeObject.query['wallet-filter-status']).toBe('Success');
    expect(onSyncFromUrl).toHaveBeenCalledTimes(2);

    wrapper.unmount();
  });
});
