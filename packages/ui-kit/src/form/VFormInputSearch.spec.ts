import { afterEach, describe, expect, it } from 'vitest';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import VFormInputSearch from './VFormInputSearch.vue';

enableAutoUnmount(afterEach);

describe('search input artwork', () => {
  it('retains default search artwork and clears through its non-submit button', async () => {
    const wrapper = mount(VFormInputSearch, {
      props: {
        modelValue: 'query',
      },
    });

    const clearButton = wrapper.get('button[aria-label="Clear search"]');

    expect(clearButton.attributes('type')).toBe('button');
    expect(wrapper.find('.lucide-search').exists()).toBe(true);
    expect(clearButton.find('.lucide-x').exists()).toBe(true);
    await clearButton.trigger('click');
    expect(wrapper.get('input').element.value).toBe('');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);
    expect(wrapper.emitted('@update:modelValue')?.at(-1)).toEqual(['']);
    expect(wrapper.find('button[aria-label="Clear search"]').exists()).toBe(false);
  });

  it('accepts host search and clear artwork while retaining model and clear behavior', async () => {
    const wrapper = mount(VFormInputSearch, {
      props: { modelValue: '' },
      slots: {
        'search-icon': '<svg data-testid="custom-search" aria-hidden="true" />',
        'clear-icon': '<svg data-testid="custom-clear" aria-hidden="true" />',
      },
    });

    expect(wrapper.find('[data-testid="custom-search"]').exists()).toBe(true);
    expect(wrapper.find('.lucide-search').exists()).toBe(false);
    expect(wrapper.find('[data-testid="custom-clear"]').exists()).toBe(false);
    await wrapper.get('input').setValue('document');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['document']);
    const clearButton = wrapper.get('button[aria-label="Clear search"]');
    expect(clearButton.attributes('type')).toBe('button');
    expect(clearButton.find('[data-testid="custom-clear"]').exists()).toBe(true);
    expect(clearButton.find('.lucide-x').exists()).toBe(false);
    await clearButton.trigger('click');
    expect(wrapper.get('input').element.value).toBe('');
    await wrapper.setProps({ modelValue: 'updated' });
    expect(wrapper.get('input').element.value).toBe('updated');
  });

});
