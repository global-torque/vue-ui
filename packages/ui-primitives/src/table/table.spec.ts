import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '.';

describe('Table', () => {
  it('renders semantic table parts inside a scroll container', () => {
    const wrapper = mount(Table, {
      slots: {
        default: () => [
          h(TableHeader, null, () => h(TableRow, null, () => h(TableHead, null, () => 'Investor'))),
          h(TableBody, null, () => h(TableRow, null, () => h(TableCell, null, () => 'Ada'))),
        ],
      },
    });
    expect(wrapper.find('[data-slot="table-container"] table[data-slot="table"]').exists()).toBe(true);
    expect(wrapper.get('thead th').text()).toBe('Investor');
    expect(wrapper.get('tbody td').text()).toBe('Ada');
  });

  it('spans the empty row across the given columns', () => {
    const wrapper = mount(Table, {
      slots: { default: () => h(TableBody, null, () => h(TableEmpty, { colspan: 4 }, () => 'No rows')) },
    });
    expect(wrapper.get('td').attributes('colspan')).toBe('4');
    expect(wrapper.text()).toContain('No rows');
  });
});
