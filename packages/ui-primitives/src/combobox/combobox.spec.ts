import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Combobox, ComboboxAnchor, ComboboxInput, ComboboxTrigger,
} from '.';

describe('Combobox', () => {
  it('renders a combobox input inside its anchor', () => {
    const wrapper = mount(Combobox, {
      slots: {
        default: () => h(ComboboxAnchor, () => [
          h(ComboboxInput, { 'aria-label': 'Fund', 'placeholder': 'Pick' }),
          h(ComboboxTrigger, { 'aria-label': 'Show' }, () => 'v'),
        ]),
      },
    });
    expect(wrapper.find('[data-slot="combobox-anchor"]').exists()).toBe(true);
    const input = wrapper.get('input');
    expect(input.attributes('role')).toBe('combobox');
    expect(input.attributes('placeholder')).toBe('Pick');
    expect(wrapper.get('[data-slot="combobox-trigger"]').attributes('aria-label')).toBe('Show');
  });
});
