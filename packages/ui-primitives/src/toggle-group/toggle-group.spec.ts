import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { ToggleGroup, ToggleGroupItem } from '.';

describe('ToggleGroup', () => {
  it('shares variant and size with its items and marks the default value', () => {
    const wrapper = mount(ToggleGroup, {
      props: { type: 'single', defaultValue: 'a', variant: 'outline', size: 'sm' },
      slots: { default: () => [h(ToggleGroupItem, { value: 'a' }, () => 'A'), h(ToggleGroupItem, { value: 'b' }, () => 'B')] },
    });
    expect(wrapper.get('[data-slot="toggle-group"]').attributes('data-variant')).toBe('outline');
    const items = wrapper.findAll('[data-slot="toggle-group-item"]');
    expect(items[0].attributes('data-state')).toBe('on');
    expect(items[1].attributes('data-state')).toBe('off');
    expect(items[1].attributes('data-size')).toBe('sm');
  });
});
