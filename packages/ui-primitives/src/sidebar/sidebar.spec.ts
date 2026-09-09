import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '.';

const Demo = defineComponent({
  setup: () => () => h(SidebarProvider, { defaultOpen: true }, () => [
    h(Sidebar, null, () => h(SidebarContent, null, () => h(SidebarMenu, null, () => h(SidebarMenuItem, null, () => h(SidebarMenuButton, { isActive: true }, () => 'Funds'))))),
    h(SidebarInset, null, () => h(SidebarTrigger)),
  ]),
});

describe('Sidebar', () => {
  it.each(['absent', 'observe', 'cancel'])('retains mobile autofocus with handler mode=%s', async (mode) => {
    const cancel = mode === 'cancel';
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(width < 768px)', media: query,
      addEventListener() {}, removeEventListener() {},
    }));
    const onOpenAutoFocus = vi.fn((event: Event) => {
      expect(event.cancelable).toBe(true);
      expect(event.target).toBeInstanceOf(HTMLElement);
      if (cancel && event.target instanceof HTMLElement) {
        event.preventDefault();
        event.target.focus();
      }
    });
    const wrapper = mount(SidebarProvider, {
      attachTo: document.body,
      props: { persistState: false },
      slots: { default: () => [
        h(Sidebar, mode === 'absent' ? {} : { onOpenAutoFocus }, () => h('button', { id: 'first-sidebar-action' }, 'First action')),
        h(SidebarTrigger),
      ] },
    });
    try {
      await wrapper.get('[data-slot="sidebar-trigger"]').trigger('click');
      await flushPromises();
      await vi.waitFor(() => expect(document.querySelector('[data-mobile="true"]')?.contains(document.activeElement)).toBe(true));
      expect(onOpenAutoFocus).toHaveBeenCalledTimes(mode === 'absent' ? 0 : 1);
      const panel = document.querySelector('[data-mobile="true"]');
      expect(panel?.getAttribute('data-state')).toBe('open');
      expect(document.activeElement).toBe(cancel ? panel : document.getElementById('first-sidebar-action'));
      if (mode !== 'absent') expect(onOpenAutoFocus.mock.calls[0][0].defaultPrevented).toBe(cancel);
    } finally {
      wrapper.unmount();
      vi.unstubAllGlobals();
    }
  });

  it('starts expanded, marks the active button and collapses from the trigger', async () => {
    const wrapper = mount(Demo);
    const sidebar = wrapper.get('[data-slot="sidebar"]');
    expect(sidebar.attributes('data-state')).toBe('expanded');
    expect(wrapper.get('[data-slot="sidebar-menu-button"]').attributes('data-active')).toBe('true');

    await wrapper.get('[data-slot="sidebar-trigger"]').trigger('click');
    expect(sidebar.attributes('data-state')).toBe('collapsed');
    wrapper.unmount();
  });
});
