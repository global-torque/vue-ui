import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Button } from '.';

describe('Button', () => {
  it('renders a native button with variant and size classes', () => {
    const wrapper = mount(Button, { props: { variant: 'destructive', size: 'sm' }, slots: { default: 'Delete' } });
    const button = wrapper.get('button');
    expect(button.attributes('data-slot')).toBe('button');
    expect(button.classes()).toContain('bg-destructive');
    expect(button.classes()).toContain('h-control-sm');
    expect(button.text()).toBe('Delete');
  });

  it('renders as another element and forwards native attributes', () => {
    const link = mount(Button, { props: { as: 'a' }, attrs: { href: '#go' }, slots: { default: 'Go' } });
    expect(link.get('a').attributes('href')).toBe('#go');
    const disabled = mount(Button, { attrs: { disabled: true }, slots: { default: 'Wait' } });
    expect(disabled.get('button').attributes('disabled')).toBeDefined();
  });
});
