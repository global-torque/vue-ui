import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from '.';

describe('Carousel', () => {
  it('exposes the carousel region, slides and controls', () => {
    const wrapper = mount(Carousel, {
      slots: {
        default: () => [
          h(CarouselContent, () => [h(CarouselItem, () => 'One'), h(CarouselItem, () => 'Two')]),
          h(CarouselPrevious),
          h(CarouselNext),
        ],
      },
    });
    const region = wrapper.get('[data-slot="carousel"]');
    expect(region.attributes('role')).toBe('region');
    expect(region.attributes('aria-roledescription')).toBe('carousel');
    const slides = wrapper.findAll('[data-slot="carousel-item"]');
    expect(slides).toHaveLength(2);
    expect(slides[0].attributes('aria-roledescription')).toBe('slide');
    expect(wrapper.find('[data-slot="carousel-previous"]').exists()).toBe(true);
    expect(wrapper.find('[data-slot="carousel-next"]').exists()).toBe(true);
  });
});
