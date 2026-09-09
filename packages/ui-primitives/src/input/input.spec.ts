import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { Input } from '.';

describe('Input', () => {
  it('forwards native state', () => {
    const input = mount(Input, { props: { modelValue: 'a' }, attrs: { 'aria-invalid': 'true', disabled: true } }).get('input');
    expect(input.attributes('data-slot')).toBe('input');
    expect(input.element.value).toBe('a');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('disabled')).toBeDefined();
  });

  it('updates the model on input', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(Input, { props: { 'modelValue': 'a', 'onUpdate:modelValue': onUpdate } });
    await wrapper.get('input').setValue('b');
    expect(onUpdate).toHaveBeenCalledWith('b');
  });
});
