import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '.';

const Demo = defineComponent({
  setup: () => () => h(DropdownMenu, { defaultOpen: true }, () => [
    h(DropdownMenuTrigger, null, () => 'Open'),
    h(DropdownMenuContent, null, () => [
      h(DropdownMenuItem, null, () => 'Edit'),
      h(DropdownMenuItem, { disabled: true }, () => 'Archive'),
      h(DropdownMenuItem, { variant: 'destructive' }, () => 'Delete'),
    ]),
  ]),
});

describe('DropdownMenu', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('renders a menu with items, disabled and destructive states', async () => {
    mount(Demo, { attachTo: document.body });
    await flushPromises();
    const menu = document.body.querySelector('[data-slot="dropdown-menu-content"]');
    expect(menu?.getAttribute('role')).toBe('menu');
    const items = [...document.body.querySelectorAll('[role="menuitem"]')];
    expect(items.map(item => item.textContent?.trim())).toEqual(['Edit', 'Archive', 'Delete']);
    expect(items[1].getAttribute('aria-disabled')).toBe('true');
    expect(items[2].getAttribute('data-variant')).toBe('destructive');
  });
});
