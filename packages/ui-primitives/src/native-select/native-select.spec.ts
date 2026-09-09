import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { NativeSelect, NativeSelectOption } from '.';

describe('NativeSelect', () => {
  it('renders a native select with options and forwards invalid state', () => {
    const wrapper = mount(NativeSelect, {
      attrs: { 'aria-invalid': 'true' },
      slots: { default: () => [h(NativeSelectOption, { value: 'a' }, () => 'A'), h(NativeSelectOption, { value: 'b' }, () => 'B')] },
    });
    const select = wrapper.get('select');
    expect(select.attributes('data-slot')).toBe('native-select');
    expect(select.attributes('aria-invalid')).toBe('true');
    expect(wrapper.findAll('option')).toHaveLength(2);
  });
});
