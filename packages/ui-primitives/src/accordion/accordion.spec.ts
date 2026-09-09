import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '.';

describe('Accordion', () => {
  it('opens the default item and toggles another on click', async () => {
    const wrapper = mount(Accordion, {
      props: { type: 'single', collapsible: true, defaultValue: 'a' },
      slots: {
        default: () => [
          h(AccordionItem, { value: 'a' }, () => [h(AccordionTrigger, () => 'First'), h(AccordionContent, () => 'First body')]),
          h(AccordionItem, { value: 'b' }, () => [h(AccordionTrigger, () => 'Second'), h(AccordionContent, () => 'Second body')]),
        ],
      },
    });
    const triggers = wrapper.findAll('[data-slot="accordion-trigger"]');
    expect(triggers[0].attributes('aria-expanded')).toBe('true');
    expect(triggers[1].attributes('aria-expanded')).toBe('false');
    await triggers[1].trigger('click');
    expect(triggers[1].attributes('aria-expanded')).toBe('true');
    expect(triggers[0].attributes('aria-expanded')).toBe('false');
  });
});
