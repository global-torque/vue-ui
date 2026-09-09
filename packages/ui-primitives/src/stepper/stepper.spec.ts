import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { Stepper, StepperIndicator, StepperItem, StepperTitle, StepperTrigger } from '.';

const Demo = defineComponent({
  setup: () => () => h(Stepper, { defaultValue: 2 }, () => [1, 2, 3].map(step => h(StepperItem, { step }, () => h(StepperTrigger, null, () => [
    h(StepperIndicator, null, () => String(step)),
    h(StepperTitle, null, () => `Step ${step}`),
  ])))),
});

describe('Stepper', () => {
  it('marks items completed, active and inactive around the current step', () => {
    const wrapper = mount(Demo);
    const states = wrapper.findAll('[role="group"] > [data-state]').map(item => item.attributes('data-state'));
    expect(states).toEqual(['completed', 'active', 'inactive']);
  });
});
