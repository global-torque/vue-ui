import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '.';

const Demo = defineComponent({
  setup: () => () => h(Command, null, () => [
    h(CommandInput, { placeholder: 'Search' }),
    h(CommandList, null, () => [
      h(CommandEmpty, null, () => 'Nothing'),
      h(CommandGroup, { heading: 'Pages' }, () => [
        h(CommandItem, { value: 'investors' }, () => 'Investors'),
        h(CommandItem, { value: 'documents' }, () => 'Documents'),
      ]),
    ]),
  ]),
});

const visibleItems = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('[role="option"]').map(item => item.text());

describe('Command', () => {
  it('filters items by the search text and shows the empty state', async () => {
    const wrapper = mount(Demo);
    expect(visibleItems(wrapper)).toEqual(['Investors', 'Documents']);

    await wrapper.get('input').setValue('inv');
    expect(visibleItems(wrapper)).toEqual(['Investors']);
    expect(wrapper.find('[data-slot="command-empty"]').exists()).toBe(false);

    await wrapper.get('input').setValue('zzz');
    expect(visibleItems(wrapper)).toEqual([]);
    expect(wrapper.get('[data-slot="command-empty"]').text()).toBe('Nothing');
  });
});
