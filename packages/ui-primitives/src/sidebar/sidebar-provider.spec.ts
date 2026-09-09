import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { SidebarProvider, useSidebar } from '.';

// Provider behavior is tested through its public context; the investor host
// independently proves its false/false policy and real keyboard interactions.
describe('SidebarProvider policy', () => {
  let context: NonNullable<ReturnType<typeof useSidebar>>;
  let wrapper: ReturnType<typeof mount>;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let width = 1024;
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
  const resize = async (next: number) => {
    width = next;
    listeners.forEach(listener => listener({ matches: width < 768 } as MediaQueryListEvent));
    await nextTick();
  };
  beforeEach(() => {
    width = 1024;
    document.cookie = 'sidebar_state=; path=/; max-age=0';
    vi.stubGlobal('matchMedia', (query: string) => ({
      media: query,
      get matches() { return width < 768; },
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
  it('retains cookie-backed defaults and writes toggles by default', async () => {
    document.cookie = 'sidebar_state=false; path=/';
    start();
    expect(context.open.value).toBe(false);
    await wrapper.get('button').trigger('click');
    expect(document.cookie).toContain('sidebar_state=true');
  });
  it('ignores stored state and never writes it when persistence is disabled', async () => {
    document.cookie = 'sidebar_state=false; path=/';
    start({ persistState: false });
    expect(context.open.value).toBe(true);
    await wrapper.get('button').trigger('click');
    expect(document.cookie).toContain('sidebar_state=false');
    await wrapper.get('button').trigger('click');
    expect(document.cookie).toContain('sidebar_state=false');
  });
  it.each([true, false])('respects keyboardShortcut=%s without swallowing disabled shortcuts', async (keyboardShortcut) => {
    start({ defaultOpen: false, keyboardShortcut });
    const event = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, cancelable: true });
    window.dispatchEvent(event);
    await nextTick();
    expect(context.open.value).toBe(keyboardShortcut);
    expect(event.defaultPrevented).toBe(keyboardShortcut);
  });
  it('uses <768 and closes the mobile sheet when returning to desktop', async () => {
    start({ defaultOpen: false, persistState: false });
    await resize(767);
    expect(context.isMobile.value).toBe(true);
    context.setOpenMobile(true);
    await resize(768);
    expect(context.isMobile.value).toBe(false);
    expect(context.openMobile.value).toBe(false);
    await resize(769);
    expect(context.isMobile.value).toBe(false);
    await resize(767);
    expect(context.openMobile.value).toBe(false);
    expect(context.open.value).toBe(false);
  });
});
