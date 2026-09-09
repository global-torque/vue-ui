import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import {
  Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger,
} from '.';

describe('Dialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an accessible modal when open', async () => {
    const wrapper = mount(Dialog, {
      attachTo: document.body,
      props: { defaultOpen: true },
      slots: {
        default: () => [
          h(DialogTrigger, () => 'Open'),
          h(DialogContent, () => [h(DialogTitle, () => 'Title'), h(DialogDescription, () => 'Description')]),
        ],
      },
    });
    await nextTick();
    const content = document.querySelector('[data-slot="dialog-content"]');
    expect(content?.getAttribute('role')).toBe('dialog');
    expect(document.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('Title');
    expect(document.querySelector('[data-slot="dialog-close"]')).not.toBeNull();
    wrapper.unmount();
  });
});
