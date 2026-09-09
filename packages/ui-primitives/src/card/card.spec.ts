import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '.';

describe('Card', () => {
  it('renders every region with its slot content', () => {
    const wrapper = mount(Card, {
      slots: {
        default: () => [
          h(CardHeader, () => [h(CardTitle, () => 'Title'), h(CardDescription, () => 'Description')]),
          h(CardContent, () => 'Body'),
          h(CardFooter, () => 'Footer'),
        ],
      },
    });
    for (const [slot, text] of [['card-title', 'Title'], ['card-description', 'Description'], ['card-content', 'Body'], ['card-footer', 'Footer']]) {
      expect(wrapper.get(`[data-slot="${slot}"]`).text()).toBe(text);
    }
    expect(wrapper.get('[data-slot="card"]').classes()).toContain('rounded-xl');
  });
});
