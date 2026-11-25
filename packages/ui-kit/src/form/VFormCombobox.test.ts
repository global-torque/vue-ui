import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import VFormCombobox from './VFormCombobox.vue';

enableAutoUnmount(afterEach);

afterEach(() => vi.unstubAllGlobals());

it('starts filtering with the first typed key and only updates the form on selection', async () => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  const wrapper = mount(VFormCombobox, {
    attachTo: document.body,
    props: {
      'aria-label': 'Country',
      modelValue: 'US',
      options: [
        { label: 'United States', value: 'US' },
        { label: 'Canada', value: 'CA' },
      ],
    },
  });
  const trigger = wrapper.get<HTMLElement>('[aria-label="Country"]');
  const searchInput = () => document.querySelector<HTMLInputElement>('input[aria-label="Search"]');

  trigger.element.focus();
  expect(searchInput()).toBeNull();
  await trigger.trigger('keydown', { key: 'C' });

  await vi.waitFor(() => {
    expect(searchInput()?.value).toBe('C');
    expect(document.activeElement).toBe(searchInput());
  });
  const search = searchInput()!;
  search.value += 'an';
  search.dispatchEvent(new Event('input', { bubbles: true }));

  await vi.waitFor(() => {
    expect(Array.from(document.querySelectorAll('[role="option"]'), option => option.textContent?.trim()))
      .toEqual(['Canada']);
  });
  expect(wrapper.emitted('update:modelValue')).toBeUndefined();

  document.querySelector<HTMLElement>('[role="option"]')!.click();
  expect(wrapper.emitted('update:modelValue')).toEqual([['CA']]);
});
