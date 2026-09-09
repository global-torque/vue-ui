import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from '.';

describe('Empty', () => {
  it('renders the header parts and the icon media variant', () => {
    const wrapper = mount(Empty, {
      slots: {
        default: () => h(EmptyHeader, () => [
          h(EmptyMedia, { variant: 'icon' }, () => 'i'),
          h(EmptyTitle, () => 'Nothing here'),
          h(EmptyDescription, () => 'Add something.'),
        ]),
      },
    });
    expect(wrapper.find('[data-slot="empty"]').exists()).toBe(true);
    expect(wrapper.get('[data-slot="empty-icon"]').classes()).toContain('bg-muted');
    expect(wrapper.get('[data-slot="empty-title"]').text()).toBe('Nothing here');
    expect(wrapper.get('[data-slot="empty-description"]').text()).toBe('Add something.');
  });
});
