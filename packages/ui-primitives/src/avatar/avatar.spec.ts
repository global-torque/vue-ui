import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { Avatar, AvatarFallback } from '.';

describe('Avatar', () => {
  it('shows the fallback when no image is available', async () => {
    const wrapper = mount(Avatar, { slots: { default: () => h(AvatarFallback, () => 'GT') } });
    await flushPromises();
    expect(wrapper.find('[data-slot="avatar"]').exists()).toBe(true);
    expect(wrapper.get('[data-slot="avatar-fallback"]').text()).toBe('GT');
  });
});
