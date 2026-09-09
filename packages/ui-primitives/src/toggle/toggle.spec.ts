import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Toggle } from '.';

describe('Toggle', () => {
  it('reflects pressed state and variant classes', async () => {
    const wrapper = mount(Toggle, { props: { defaultValue: true, variant: 'outline' }, slots: { default: 'B' } });
    const toggle = wrapper.get('[data-slot="toggle"]');
    expect(toggle.attributes('aria-pressed')).toBe('true');
    expect(toggle.classes()).toContain('border');
    await toggle.trigger('click');
    expect(toggle.attributes('aria-pressed')).toBe('false');
  });
});
