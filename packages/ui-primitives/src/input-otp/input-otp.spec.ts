import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '.';

describe('InputOTP', () => {
  it('renders one slot per index over a single hidden input', () => {
    const wrapper = mount(InputOTP, {
      props: { maxlength: 4, modelValue: '12' },
      slots: { default: () => h(InputOTPGroup, () => [0, 1, 2, 3].map(index => h(InputOTPSlot, { index }))) },
    });
    expect(wrapper.find('[data-slot="input-otp"]').exists()).toBe(true);
    const slots = wrapper.findAll('[data-slot="input-otp-slot"]');
    expect(slots).toHaveLength(4);
    expect(slots[0].text()).toBe('1');
    expect(slots[1].text()).toBe('2');
    expect(wrapper.get('input').attributes('maxlength')).toBe('4');
  });
});
