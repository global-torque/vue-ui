import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Textarea } from '.';

describe('Textarea', () => {
  it('binds the model and forwards native state', async () => {
    const wrapper = mount(Textarea, { props: { modelValue: 'note' }, attrs: { 'aria-invalid': 'true' } });
    const textarea = wrapper.get('textarea');
    expect(textarea.attributes('data-slot')).toBe('textarea');
    expect(textarea.element.value).toBe('note');
    expect(textarea.attributes('aria-invalid')).toBe('true');
    await textarea.setValue('longer note');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['longer note']);
  });
});
