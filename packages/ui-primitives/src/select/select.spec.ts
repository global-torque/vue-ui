import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '.';

describe('Select', () => {
  it('renders an accessible trigger with a placeholder', () => {
    const wrapper = mount(Select, {
      slots: {
        default: () => [
          h(SelectTrigger, { 'aria-label': 'Currency' }, () => h(SelectValue, { placeholder: 'Pick one' })),
          h(SelectContent, () => h(SelectItem, { value: 'usd' }, () => 'USD')),
        ],
      },
    });
    const trigger = wrapper.get('[data-slot="select-trigger"]');
    expect(trigger.attributes('role')).toBe('combobox');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(trigger.text()).toContain('Pick one');
    expect(trigger.find('.lucide-chevron-down').exists()).toBe(true);
    wrapper.unmount();
  });

  it('retains keyboard opening and selection with a custom decorative icon', async () => {
    const updates: unknown[] = [];
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: { 'onUpdate:modelValue': value => updates.push(value) },
      slots: {
        default: () => [
          h(SelectTrigger, { 'aria-label': 'Currency' }, {
            default: () => h(SelectValue, { placeholder: 'Pick one' }),
            icon: () => h('svg', { 'data-custom-icon': '' }),
          }),
          h(SelectContent, () => h(SelectItem, { value: 'usd' }, () => 'USD')),
        ],
      },
    });
    try {
      const trigger = wrapper.get('[data-slot="select-trigger"]');
      expect(trigger.get('[data-custom-icon]').attributes('aria-hidden')).toBe('true');
      expect(trigger.find('.lucide-chevron-down').exists()).toBe(false);
      (trigger.element as HTMLElement).focus();
      await trigger.trigger('keydown', { key: 'ArrowDown' });
      await flushPromises();
      expect(trigger.attributes('aria-expanded')).toBe('true');
      const option = document.querySelector<HTMLElement>('[role="option"]');
      expect(option).not.toBeNull();
      option!.focus();
      option!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await flushPromises();
      expect(updates).toEqual(['usd']);
      expect(trigger.attributes('aria-expanded')).toBe('false');
      expect(trigger.text()).toContain('USD');
    } finally {
      wrapper.unmount();
    }
  });

  it('uses the shared popup layer and allows a host override', async () => {
    const wrapper = mount(Select, {
      attachTo: document.body,
      slots: {
        default: () => [
          h(SelectTrigger, { 'aria-label': 'Currency' }, () => h(SelectValue, { placeholder: 'Pick one' })),
          h(SelectContent, { class: 'z-[1101]' }, () => h(SelectItem, { value: 'usd' }, () => 'USD')),
        ],
      },
    });
    try {
      const trigger = wrapper.get('[data-slot="select-trigger"]');
      await trigger.trigger('keydown', { key: 'ArrowDown' });
      await flushPromises();
      const content = document.querySelector('[data-slot="select-content"]');
      expect(content?.className).toContain('z-[1101]');
      expect(content?.className).not.toContain('z-[var(--ui-select-popup-z-index,var(--ui-dialog-z-index,1100))]');
    } finally {
      wrapper.unmount();
    }
  });
});
