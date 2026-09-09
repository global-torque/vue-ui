import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Label } from '.';

describe('Label', () => {
  it('renders a label element bound to its control', () => {
    const label = mount(Label, { props: { for: 'name' }, slots: { default: 'Name' } }).get('label');
    expect(label.attributes('data-slot')).toBe('label');
    expect(label.attributes('for')).toBe('name');
    expect(label.text()).toBe('Name');
  });
});
