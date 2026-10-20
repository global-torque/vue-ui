import { flushPromises, mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import VFormSelect from './VFormSelect.vue';
import VFormDatePicker from './VFormDatePicker.vue';
import VFormCombobox from './VFormCombobox.vue';

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

describe('form selector artwork', () => {
  it('maps every supported control size', async () => {
    const wrapper = mount(VFormSelect, {
      props: { options: ['USD'], size: 'small', modelValue: 'USD' },
      attrs: { 'aria-label': 'Network' },
    });
    try {
      await flushPromises();
      const trigger = wrapper.get('[role="combobox"]');
      expect(trigger.text()).toContain('USD');
      expect(trigger.attributes('data-size')).toBe('sm');
      await wrapper.setProps({ size: 'medium' });
      expect(trigger.attributes('data-size')).toBe('default');
      await wrapper.setProps({ size: 'large', readonly: true });
      expect(trigger.attributes('data-size')).toBe('default');
      expect(trigger.attributes('disabled')).toBeDefined();
      await trigger.trigger('keydown', { key: 'ArrowDown' });
      expect(trigger.attributes('aria-expanded')).toBe('false');
    } finally {
      wrapper.unmount();
    }
  });

  it.each(['popper', 'item-aligned'] as const)('retains keyboard selection with %s content', async (contentPosition) => {
    Element.prototype.scrollIntoView ??= () => {};
    const wrapper = mount(VFormSelect, {
      attachTo: document.body,
      props: { options: ['USD', 'CAD'], modelValue: 'USD', contentPosition },
      attrs: { 'aria-label': 'Currency' },
    });
    try {
      await flushPromises();
      const trigger = wrapper.get('[role="combobox"]');
      (trigger.element as HTMLElement).focus();
      await trigger.trigger('keydown', { key: 'ArrowDown' });
      await flushPromises();
      expect(trigger.attributes('aria-expanded')).toBe('true');
      const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
        .find(element => element.textContent?.trim() === 'CAD');
      expect(option).toBeDefined();
      option!.focus();
      option!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await flushPromises();
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['CAD']);
      expect(trigger.attributes('aria-expanded')).toBe('false');
    } finally {
      wrapper.unmount();
    }
  });

  it('keeps date artwork decorative and excludes it from readonly fields', async () => {
    const wrapper = mount(VFormDatePicker, {
      props: { modelValue: '2000-01-02' },
      attrs: { 'aria-label': 'Date of Birth' },
      slots: { icon: '<svg data-date-artwork aria-hidden="true" />' },
    });
    try {
      const button = wrapper.get('button.VFormDatePicker');
      expect(button.text()).toBe('01/02/2000');
      expect(button.find('[data-date-artwork]').exists()).toBe(true);
      expect(button.find('.lucide-calendar').exists()).toBe(false);
      await wrapper.setProps({ readonly: true });
      expect(button.attributes('disabled')).toBeDefined();
      expect(button.find('[data-date-artwork]').exists()).toBe(false);
      expect(button.text()).toBe('01/02/2000');
    } finally {
      wrapper.unmount();
    }
  });

  it('forwards combobox artwork and attributes to the trigger and shows the selected label', async () => {
    const wrapper = mount(VFormCombobox, {
      props: {
        options: [{ name: 'California', value: 'CA' }, { name: 'Colorado', value: 'CO' }],
        itemLabel: 'name',
        modelValue: 'CA',
      },
      attrs: { 'aria-label': 'State' },
      slots: { icon: '<svg data-combobox-artwork aria-hidden="true" />' },
    });
    try {
      const trigger = wrapper.get('button');
      expect(trigger.attributes('role')).toBe('combobox');
      expect(trigger.attributes('aria-label')).toBe('State');
      expect(trigger.attributes('type')).toBe('button');
      expect(trigger.text()).toBe('California');
      expect(trigger.find('[data-combobox-artwork]').exists()).toBe(true);
      expect(trigger.find('.lucide-chevrons-up-down').exists()).toBe(false);
      await wrapper.setProps({ modelValue: 'CO' });
      expect(trigger.text()).toBe('Colorado');
    } finally {
      wrapper.unmount();
    }
  });

});
