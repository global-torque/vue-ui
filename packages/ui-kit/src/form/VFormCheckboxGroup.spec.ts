import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VFormCheckboxGroup from './VFormCheckboxGroup.vue';
import VFormCheckbox from './VFormCheckbox.vue';

describe('VFormCheckboxGroup host ownership', () => {
  it('emits detached selections without mutating a frozen host model', () => {
    const model = Object.freeze(['one']);
    const wrapper = mount(VFormCheckboxGroup, {
      props: { options: ['one', 'two'], modelValue: model as unknown as string[] },
    });
    const fields = wrapper.findAllComponents(VFormCheckbox);
    fields[1].vm.$emit('update:modelValue', true);
    fields[1].vm.$emit('update:modelValue', true);
    fields[0].vm.$emit('update:modelValue', false);
    expect(model).toEqual(['one']);
    expect(wrapper.emitted('update:modelValue')).toEqual([
      [['one', 'two']], [['one', 'two']], [['two']],
    ]);
    wrapper.unmount();
  });
});
