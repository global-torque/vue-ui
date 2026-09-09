import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '.';

const Demo = defineComponent({
  setup: () => () => h(Collapsible, null, () => [
    h(CollapsibleTrigger, null, () => 'Toggle'),
    h(CollapsibleContent, null, () => 'Details'),
  ]),
});

describe('Collapsible', () => {
  it('toggles the content from the trigger', async () => {
    const wrapper = mount(Demo);
    const trigger = wrapper.get('[data-slot="collapsible-trigger"]');
    const content = wrapper.find('[data-slot="collapsible-content"]');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(content.exists() && content.isVisible()).toBe(false);

    await trigger.trigger('click');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('[data-slot="collapsible-content"]').text()).toBe('Details');
    expect(wrapper.get('[data-slot="collapsible"]').attributes('data-state')).toBe('open');
  });
});
