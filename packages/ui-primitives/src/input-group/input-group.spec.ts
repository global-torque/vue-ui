import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  InputGroup, InputGroupAddon, InputGroupInput, InputGroupText,
} from '.';

describe('InputGroup', () => {
  it('groups a control with aligned addons', () => {
    const wrapper = mount(InputGroup, {
      slots: {
        default: () => [
          h(InputGroupAddon, () => h(InputGroupText, () => '$')),
          h(InputGroupInput, { 'aria-label': 'Amount' }),
          h(InputGroupAddon, { align: 'inline-end' }, () => h(InputGroupText, () => 'USD')),
        ],
      },
    });
    expect(wrapper.get('[data-slot="input-group"]').attributes('role')).toBe('group');
    expect(wrapper.get('[data-slot="input-group-control"]').attributes('aria-label')).toBe('Amount');
    const addons = wrapper.findAll('[data-slot="input-group-addon"]');
    expect(addons).toHaveLength(2);
    expect(addons[1].attributes('data-align')).toBe('inline-end');
  });
});
