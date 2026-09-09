import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Separator } from '.';

describe('Separator', () => {
  it('is horizontal and decorative by default', () => {
    const separator = mount(Separator).get('[data-slot="separator"]');
    expect(separator.attributes('data-orientation')).toBe('horizontal');
    expect(separator.attributes('role')).toBe('none');
  });

  it('exposes a semantic vertical separator when not decorative', () => {
    const separator = mount(Separator, { props: { orientation: 'vertical', decorative: false } }).get('[data-slot="separator"]');
    expect(separator.attributes('data-orientation')).toBe('vertical');
    expect(separator.attributes('role')).toBe('separator');
  });
});
