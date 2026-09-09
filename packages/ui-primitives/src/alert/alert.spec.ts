import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '.';

describe('Alert', () => {
  it('announces itself and renders title and description slots', () => {
    const wrapper = mount(Alert, {
      slots: { default: () => [h(AlertTitle, () => 'Saved'), h(AlertDescription, () => 'All changes stored.')] },
    });
    const alert = wrapper.get('[data-slot="alert"]');
    expect(alert.attributes('role')).toBe('alert');
    expect(wrapper.get('[data-slot="alert-title"]').text()).toBe('Saved');
    expect(wrapper.get('[data-slot="alert-description"]').text()).toBe('All changes stored.');
  });

  it('applies the destructive variant', () => {
    expect(mount(Alert, { props: { variant: 'destructive' } }).get('[data-slot="alert"]').classes()).toContain('text-destructive');
  });
});
