import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import {
  Dialog, DialogContent, DialogDescription, DialogScrollContent, DialogTitle, DialogTrigger,
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
    expect(content?.className).toContain('z-[var(--ui-dialog-z-index,1100)]');
    wrapper.unmount();
  });

  it('lets a caller replace the shared dialog layer', async () => {
    const wrapper = mount(Dialog, {
      attachTo: document.body,
      props: { defaultOpen: true },
      slots: {
        default: () => h(DialogContent, { class: 'z-[1200]' }, () => [
          h(DialogTitle, () => 'Title'),
          h(DialogDescription, () => 'Description'),
        ]),
      },
    });
    await nextTick();
    const content = document.querySelector('[data-slot="dialog-content"]');
    expect(content?.className).toContain('z-[1200]');
    expect(content?.className).not.toContain('z-[var(--ui-dialog-z-index,1100)]');
    wrapper.unmount();
  });

  it('keeps the scroll dialog accessible while sharing the dialog layer', async () => {
    const wrapper = mount(Dialog, {
      attachTo: document.body,
      props: { defaultOpen: true },
      slots: {
        default: () => h(DialogScrollContent, () => [
          h(DialogTitle, () => 'Scroll title'),
          h(DialogDescription, () => 'Scroll description'),
        ]),
      },
    });
    await nextTick();
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    const content = document.querySelector('[data-slot="dialog-content"]');
    const title = document.querySelector('[data-slot="dialog-title"]');
    const description = document.querySelector('[data-slot="dialog-description"]');
    expect(overlay?.className).toContain('z-[var(--ui-dialog-z-index,1100)]');
    expect(content?.className).toContain('z-[var(--ui-dialog-z-index,1100)]');
    expect(content?.getAttribute('role')).toBe('dialog');
    expect(title?.textContent).toBe('Scroll title');
    expect(description?.textContent).toBe('Scroll description');
    expect(content?.getAttribute('aria-labelledby')).toBe(title?.getAttribute('id'));
    expect(content?.getAttribute('aria-describedby')).toBe(description?.getAttribute('id'));
    wrapper.unmount();
  });
});
