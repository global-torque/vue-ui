import { CalendarDate } from '@internationalized/date';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Calendar } from '.';

describe('Calendar', () => {
  it('renders the month of the selected date with the day selected', () => {
    const wrapper = mount(Calendar, { props: { modelValue: new CalendarDate(2026, 9, 2) } });
    expect(wrapper.find('[data-slot="calendar"]').exists()).toBe(true);
    expect(wrapper.get('[data-slot="calendar-heading"]').text()).toContain('September 2026');
    const selected = wrapper.get('[data-slot="calendar-cell-trigger"][data-selected]');
    expect(selected.text()).toBe('2');
  });
});
