import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger,
} from '.';

describe('Sheet', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each(['click', 'Escape'])('supports an owned close control and %s dismissal', async (action) => {
    const wrapper = mount(Sheet, {
      attachTo: document.body,
      props: { defaultOpen: true },
      slots: {
        default: () => h(SheetContent, { showCloseButton: false }, () => [
          h(SheetTitle, () => 'Notifications'),
          h(SheetDescription, () => 'Recent updates'),
          h(SheetClose, { 'aria-label': 'Dismiss notifications' }, () => h('svg', { 'aria-hidden': 'true' })),
        ]),
      },
    });
    await flushPromises();
    const content = document.querySelector('[data-slot="sheet-content"]')!;
    const controls = content.querySelectorAll('[data-slot="sheet-close"]');
    expect(controls).toHaveLength(1);
    expect(controls[0]?.getAttribute('aria-label')).toBe('Dismiss notifications');
    expect(content.hasAttribute('showclosebutton')).toBe(false);
    expect(content.textContent).not.toContain('Close');
    expect(content.contains(document.activeElement)).toBe(true);
    if (action === 'click') (controls[0] as HTMLButtonElement).click();
    else document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flushPromises();
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it('renders a side panel dialog when open', async () => {
    const wrapper = mount(Sheet, {
      attachTo: document.body,
      props: { defaultOpen: true },
      slots: {
        default: () => [
          h(SheetTrigger, () => 'Open'),
          h(SheetContent, { side: 'left' }, () => [h(SheetTitle, () => 'Filters'), h(SheetDescription, () => 'Narrow the list')]),
        ],
      },
    });
    await nextTick();
    const content = document.querySelector('[data-slot="sheet-content"]');
    expect(content?.getAttribute('role')).toBe('dialog');
    expect(document.querySelector('[data-slot="sheet-close"]')?.textContent).toContain('Close');
    expect(content?.className).toContain('left-0');
    expect(document.querySelector('[data-slot="sheet-title"]')?.textContent).toBe('Filters');
    wrapper.unmount();
  });
});
