import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '.';

const Demo = defineComponent({
  setup: () => () => h(SidebarProvider, { defaultOpen: true }, () => [
    h(Sidebar, null, () => h(SidebarContent, null, () => h(SidebarMenu, null, () => h(SidebarMenuItem, null, () => h(SidebarMenuButton, { isActive: true }, () => 'Funds'))))),
    h(SidebarInset, null, () => h(SidebarTrigger)),
  ]),
});

describe('Sidebar', () => {
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
