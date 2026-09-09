import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { Popover, PopoverContent, PopoverTrigger } from '.';

const Demo = defineComponent({
  props: { defaultOpen: { type: Boolean, default: false } },
  setup: props => () => h(Popover, { defaultOpen: props.defaultOpen }, () => [
    h(PopoverTrigger, null, () => 'Open'),
    h(PopoverContent, null, () => 'Panel'),
  ]),
});

describe('Popover', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('opens from the trigger and exposes a dialog', async () => {
    const wrapper = mount(Demo, { attachTo: document.body });
    const trigger = wrapper.get('[data-slot="popover-trigger"]');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(document.body.querySelector('[data-slot="popover-content"]')).toBeNull();

    await trigger.trigger('click');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    const content = document.body.querySelector('[data-slot="popover-content"]');
    expect(content?.getAttribute('role')).toBe('dialog');
    expect(content?.textContent).toContain('Panel');
  });

  it('renders open with defaultOpen', async () => {
    mount(Demo, { props: { defaultOpen: true }, attachTo: document.body });
    await flushPromises();
    expect(document.body.querySelector('[data-slot="popover-content"][data-state="open"]')).not.toBeNull();
  });
});
