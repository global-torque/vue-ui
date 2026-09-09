import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Checkbox } from '.';

describe('Checkbox', () => {
  it('exposes checked state and toggles on click', async () => {
    const wrapper = mount(Checkbox, { props: { defaultValue: true } });
    const box = wrapper.get('[role="checkbox"]');
    expect(box.attributes('data-slot')).toBe('checkbox');
    expect(box.attributes('aria-checked')).toBe('true');
    await box.trigger('click');
    expect(box.attributes('aria-checked')).toBe('false');
  });
});
