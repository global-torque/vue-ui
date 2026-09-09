import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Progress } from '.';

describe('Progress', () => {
  it('exposes the value through ARIA and moves the indicator', () => {
    const wrapper = mount(Progress, { props: { modelValue: 40 } });
    const root = wrapper.get('[data-slot="progress"]');
    expect(root.attributes('role')).toBe('progressbar');
    expect(root.attributes('aria-valuenow')).toBe('40');
    expect(wrapper.get('[data-slot="progress-indicator"]').attributes('style')).toContain('translateX(-60%)');
  });
});
