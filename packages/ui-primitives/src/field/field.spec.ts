import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Field, FieldDescription, FieldError, FieldLabel,
} from '.';

describe('Field', () => {
  it('groups label, description and error with the right semantics', () => {
    const wrapper = mount(Field, {
      attrs: { 'data-invalid': 'true' },
      slots: {
        default: () => [
          h(FieldLabel, { for: 'amount' }, () => 'Amount'),
          h('input', { id: 'amount' }),
          h(FieldDescription, () => 'In USD'),
          h(FieldError, () => 'Must be positive'),
        ],
      },
    });
    const field = wrapper.get('[data-slot="field"]');
    expect(field.attributes('role')).toBe('group');
    expect(field.classes()).toContain('flex-col');
    expect(field.classes()).toContain('data-[invalid=true]:text-destructive');
    expect(wrapper.get('[data-slot="field-label"]').attributes('for')).toBe('amount');
    expect(wrapper.get('[data-slot="field-error"]').attributes('role')).toBe('alert');
    expect(wrapper.get('[data-slot="field-error"]').text()).toBe('Must be positive');
  });

  it('supports a horizontal orientation', () => {
    expect(mount(Field, { props: { orientation: 'horizontal' } }).get('[data-slot="field"]').attributes('data-orientation')).toBe('horizontal');
  });
});
