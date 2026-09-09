import { mount } from '@vue/test-utils';
import {
  defineComponent,
  nextTick,
  type ShallowRef,
} from 'vue';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { useReactiveLocation } from '../useReactiveLocation';

const mountComposable = (fallbackPath = '/') => {
  let locationPath!: ShallowRef<string>;

  const wrapper = mount(defineComponent({
    setup() {
      locationPath = useReactiveLocation(fallbackPath);
      return () => null;
    },
  }));

  return { wrapper, locationPath };
};

describe('useReactiveLocation', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('tracks history push and replace updates', async () => {
    const { wrapper, locationPath } = mountComposable();

    expect(locationPath.value).toBe('/');

    window.history.pushState({}, '', '/notifications?notification-tab=accounts');
    await nextTick();

    expect(locationPath.value).toBe('/notifications?notification-tab=accounts');

    window.history.replaceState({}, '', '/settings/12/security#devices');
    await nextTick();

    expect(locationPath.value).toBe('/settings/12/security#devices');

    wrapper.unmount();
  });

  it('reacts to browser navigation events', async () => {
    const { wrapper, locationPath } = mountComposable();

    window.history.replaceState({}, '', '/offers');
    await nextTick();

    window.location.hash = '#new';
    window.dispatchEvent(new Event('hashchange'));
    await nextTick();

    expect(locationPath.value).toBe('/offers#new');

    window.history.replaceState({}, '', '/faq');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await nextTick();

    expect(locationPath.value).toBe('/faq');

    wrapper.unmount();
  });
});
