import { afterEach, describe, expect, it } from 'vitest';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import VFormRadio from './VFormRadio.vue';
import VFormLabel from './VFormLabel.vue';

enableAutoUnmount(afterEach);

describe('radio indicator composition', () => {
  const options = [{ value: true, text: 'Yes' }, { value: false, text: 'No' }];

  it('retains the default dot and label association', () => {
    const wrapper = mount(VFormRadio, { props: { modelValue: true, options } });
    const radios = wrapper.findAll('[role="radio"]');
    expect(radios[0].find('.lucide-circle').exists()).toBe(true);
    expect(wrapper.get('label').attributes('for')).toBe(radios[0].attributes('id'));
    expect(radios[0].attributes('aria-checked')).toBe('true');
  });

  it('forwards checked artwork while preserving typed selection and disabled state', async () => {
    const wrapper = mount(VFormRadio, {
      props: { modelValue: true, options },
      slots: { indicator: '<span data-testid="custom-dot" aria-hidden="true" />' },
    });
    const radios = wrapper.findAll('[role="radio"]');
    expect(radios[0].find('[data-testid="custom-dot"]').exists()).toBe(true);
    expect(wrapper.find('.lucide-circle').exists()).toBe(false);
    await radios[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
    expect(radios[1].attributes('aria-checked')).toBe('true');
    expect(radios[1].find('[data-testid="custom-dot"]').exists()).toBe(true);
    await wrapper.setProps({ disabled: true });
    await radios[0].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
    expect(radios.every(radio => radio.attributes('disabled') !== undefined)).toBe(true);
  });

  it('retains the explicit accessible label and decorative required mark', () => {
    const wrapper = mount(VFormLabel, {
      props: { hasAsterisk: true },
      attrs: { for: 'agreement' },
      slots: { default: 'Accept terms' },
    });
    expect(wrapper.get('label').attributes('for')).toBe('agreement');
    expect(wrapper.get('.v-form-label__content').text()).toBe('Accept terms');
    expect(wrapper.get('.v-form-label__asterisk').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('.v-form-label__asterisk').text()).toBe('*');
  });

  it('keeps arrow-key selection with host indicator artwork', async () => {
    const wrapper = mount(VFormRadio, {
      attachTo: document.body,
      props: { modelValue: true, options },
      slots: { indicator: '<span aria-hidden="true" />' },
    });
    await flushPromises();
    const radios = wrapper.findAll('[role="radio"]');
    (radios[0].element as HTMLElement).focus();
    await radios[0].trigger('keydown', { key: 'ArrowDown' });
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(document.activeElement).toBe(radios[1].element);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
  });
});
