import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { RadioGroup, RadioGroupItem } from '.';

describe('RadioGroup', () => {
  it('selects the default item and exposes radio semantics', () => {
    const wrapper = mount(RadioGroup, {
      props: { defaultValue: 'b' },
      slots: { default: () => [h(RadioGroupItem, { value: 'a' }), h(RadioGroupItem, { value: 'b' })] },
    });
    expect(wrapper.get('[data-slot="radio-group"]').attributes('role')).toBe('radiogroup');
    const items = wrapper.findAll('[role="radio"]');
    expect(items).toHaveLength(2);
    expect(items[0].attributes('aria-checked')).toBe('false');
    expect(items[1].attributes('aria-checked')).toBe('true');
  });
});
