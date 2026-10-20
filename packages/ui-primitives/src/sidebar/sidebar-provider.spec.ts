import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { SidebarProvider, useSidebar } from '.';

// Provider behavior is tested through its public context.
describe('SidebarProvider', () => {
  let context: NonNullable<ReturnType<typeof useSidebar>>;
  let wrapper: ReturnType<typeof mount>;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const Probe = defineComponent({
    setup() {
      const provided = useSidebar();
      if (!provided) throw new Error("Sidebar provider context is required");
      context = provided;
      return () => h('button', { onClick: context.toggleSidebar }, 'Toggle');
    },
  });
  const start = (props = {}) => {
    wrapper = mount(SidebarProvider, { props, slots: { default: () => h(Probe) } });
  };
  beforeEach(() => {
    document.cookie = 'sidebar_state=; path=/; max-age=0';
    vi.stubGlobal('matchMedia', (query: string) => ({
      media: query,
      matches: false,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    }));
  });
  afterEach(() => {
    wrapper?.unmount();
    document.cookie = 'sidebar_state=; path=/; max-age=0';
    vi.unstubAllGlobals();
    expect(listeners.size).toBe(0);
  });
  it('toggles and consumes the Ctrl+B shortcut', async () => {
    start({ defaultOpen: false });
    const event = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, cancelable: true });
    window.dispatchEvent(event);
    await nextTick();
    expect(context.open.value).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });
});
