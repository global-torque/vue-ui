import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Skeleton } from '.';

describe('Skeleton', () => {
  it('renders a pulsing placeholder and merges classes', () => {
    const skeleton = mount(Skeleton, { props: { class: 'h-4 w-48' } }).get('[data-slot="skeleton"]');
    expect(skeleton.classes()).toEqual(expect.arrayContaining(['animate-pulse', 'h-4', 'w-48']));
  });
});
