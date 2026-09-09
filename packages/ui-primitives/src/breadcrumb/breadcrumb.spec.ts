import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '.';

describe('Breadcrumb', () => {
  it('renders an accessible trail with a current page', () => {
    const wrapper = mount(Breadcrumb, {
      slots: {
        default: () => h(BreadcrumbList, () => [
          h(BreadcrumbItem, () => h(BreadcrumbLink, { href: '#home' }, () => 'Home')),
          h(BreadcrumbSeparator),
          h(BreadcrumbItem, () => h(BreadcrumbPage, () => 'Funds')),
        ]),
      },
    });
    expect(wrapper.get('nav').attributes('aria-label')).toBe('breadcrumb');
    expect(wrapper.get('[data-slot="breadcrumb-link"]').attributes('href')).toBe('#home');
    expect(wrapper.get('[data-slot="breadcrumb-page"]').attributes('aria-current')).toBe('page');
    const separator = wrapper.get('[data-slot="breadcrumb-separator"]');
    expect(separator.attributes('role')).toBe('presentation');
    expect(separator.attributes('aria-hidden')).toBe('true');
  });
});
