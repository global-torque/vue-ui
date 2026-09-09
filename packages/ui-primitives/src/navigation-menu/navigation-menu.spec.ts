import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '.';

const Demo = defineComponent({
  setup: () => () => h(NavigationMenu, null, () => h(NavigationMenuList, null, () => [
    h(NavigationMenuItem, null, () => [
      h(NavigationMenuTrigger, null, () => 'Products'),
      h(NavigationMenuContent, null, () => 'Panel'),
    ]),
    h(NavigationMenuItem, null, () => h(NavigationMenuLink, { href: '/pricing' }, () => 'Pricing')),
  ])),
});

describe('NavigationMenu', () => {
  it('renders a nav with a closed trigger and plain links', () => {
    const wrapper = mount(Demo);
    expect(wrapper.get('[data-slot="navigation-menu"]').element.tagName).toBe('NAV');
    expect(wrapper.get('[data-slot="navigation-menu-trigger"]').attributes('aria-expanded')).toBe('false');
    expect(wrapper.get('[data-slot="navigation-menu-link"]').attributes('href')).toBe('/pricing');
  });
});
