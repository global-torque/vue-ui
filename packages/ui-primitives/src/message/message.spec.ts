import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader,
} from '.';

describe('Message', () => {
  it('forwards semantic polymorphic elements and their slot content', () => {
    const wrapper = mount(Message, {
      props: { as: 'article' },
      slots: {
        default: () => [
          h(MessageAvatar, { as: 'figure' }, () => 'A'),
          h(MessageContent, { as: 'section' }, () => [
            h(MessageHeader, { as: 'header' }, () => 'Support'),
            h('p', 'Reply'),
            h(MessageFooter, { as: 'footer' }, () => 'Now'),
          ]),
        ],
      },
    });

    expect(wrapper.get('article').text()).toContain('Reply');
    expect(wrapper.get('figure').text()).toBe('A');
    expect(wrapper.get('section').text()).toContain('Reply');
    expect(wrapper.get('header').text()).toBe('Support');
    expect(wrapper.get('footer').text()).toBe('Now');
  });
});
