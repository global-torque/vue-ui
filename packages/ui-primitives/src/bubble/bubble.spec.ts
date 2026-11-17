import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Bubble, BubbleContent,
} from '.';

describe('Bubble', () => {
  it('forwards polymorphic button attributes and slot content', () => {
    const wrapper = mount(Bubble, {
      slots: {
        default: () => h(BubbleContent, { as: 'button', type: 'button', 'aria-label': 'Open message actions' }, () => 'Message'),
      },
    });

    const button = wrapper.get('button');
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('Open message actions');
    expect(button.text()).toBe('Message');
  });
});
