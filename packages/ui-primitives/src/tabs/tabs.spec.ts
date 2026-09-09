import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '.';

describe('Tabs', () => {
  it('selects the default tab and switches on click', async () => {
    const wrapper = mount(Tabs, {
      props: { defaultValue: 'a' },
      slots: {
        default: () => [
          h(TabsList, () => [h(TabsTrigger, { value: 'a' }, () => 'A'), h(TabsTrigger, { value: 'b' }, () => 'B')]),
          h(TabsContent, { value: 'a' }, () => 'Panel A'),
          h(TabsContent, { value: 'b' }, () => 'Panel B'),
        ],
      },
    });
    const triggers = wrapper.findAll('[role="tab"]');
    expect(triggers[0].attributes('aria-selected')).toBe('true');
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Panel A');
    await triggers[1].trigger('mousedown', { button: 0 });
    expect(triggers[1].attributes('aria-selected')).toBe('true');
    expect(triggers[0].attributes('aria-selected')).toBe('false');
    expect(wrapper.get('[role="tabpanel"][data-state="active"]').attributes('aria-labelledby')).toBe(triggers[1].attributes('id'));
  });

  it('passes the line variant to the list, triggers and panels', () => {
    const wrapper = mount(Tabs, {
      props: { defaultValue: 'a', variant: 'line' },
      slots: {
        default: () => [
          h(TabsList, () => [h(TabsTrigger, { value: 'a' }, () => 'A')]),
          h(TabsContent, { value: 'a' }, () => 'Panel A'),
        ],
      },
    });
    expect(wrapper.get('[data-slot="tabs-list"]').attributes('data-variant')).toBe('line');
    expect(wrapper.get('[data-slot="tabs-list"]').classes()).toContain('shadow-[inset_0_-2px_0_0_var(--input)]');
    expect(wrapper.get('[role="tab"]').attributes('data-variant')).toBe('line');
    expect(wrapper.get('[role="tab"]').classes()).toContain('border-b-2');
    expect(wrapper.get('[role="tabpanel"]').classes()).toContain('pt-10');
  });
});
