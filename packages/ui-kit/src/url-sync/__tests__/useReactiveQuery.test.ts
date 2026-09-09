import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import { useReactiveQuery } from '../useReactiveQuery';

describe('useReactiveQuery', () => {
  it('shares one history observer and removes each consumer listener', async () => {
    const Host = defineComponent({
      setup() {
        const query = useReactiveQuery();
        return () => h('span', query.value.get('q') ?? '');
      },
    });
    window.history.replaceState({}, '', '/?q=before');
    const first = mount(Host);
    const patched = window.history.pushState;
    const second = mount(Host);
    expect(window.history.pushState).toBe(patched);
    window.history.pushState({}, '', '/?q=after');
    await nextTick();
    expect(first.text()).toBe('after');
    expect(second.text()).toBe('after');
    first.unmount();
    window.history.replaceState({}, '', '/?q=remaining');
    await nextTick();
    expect(second.text()).toBe('remaining');
    second.unmount();
    window.history.replaceState({}, '', '/');
  });
});
