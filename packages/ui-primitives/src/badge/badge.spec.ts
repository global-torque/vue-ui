import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Badge } from '.';

describe('Badge', () => {
  it('maps variants to classes', () => {
    expect(mount(Badge, { slots: { default: 'New' } }).get('[data-slot="badge"]').classes()).toContain('bg-primary');
    expect(mount(Badge, { props: { variant: 'outline' } }).get('[data-slot="badge"]').classes()).toContain('text-foreground');
  });

  it('renders as a link when asked', () => {
    const wrapper = mount(Badge, { props: { as: 'a' }, attrs: { href: '#tag' }, slots: { default: 'Tag' } });
    expect(wrapper.get('a').attributes('href')).toBe('#tag');
  });
});
