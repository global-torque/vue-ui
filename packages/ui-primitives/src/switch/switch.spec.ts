import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Switch } from '.';

describe('Switch', () => {
  it('exposes switch semantics and toggles on click', async () => {
    const wrapper = mount(Switch, { props: { defaultValue: true } });
    const control = wrapper.get('[role="switch"]');
    expect(control.attributes('data-slot')).toBe('switch');
    expect(control.attributes('aria-checked')).toBe('true');
    expect(wrapper.find('[data-slot="switch-thumb"]').exists()).toBe(true);
    await control.trigger('click');
    expect(control.attributes('aria-checked')).toBe('false');
  });
});
