import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Spinner } from '.';

describe('Spinner', () => {
  it('is announced as a loading status and lets the size be overridden', () => {
    const spinner = mount(Spinner, { props: { class: 'size-8' } }).get('[role="status"]');
    expect(spinner.attributes('aria-label')).toBe('Loading');
    expect(spinner.classes()).toContain('size-8');
    expect(spinner.classes()).not.toContain('size-4');
  });
});
