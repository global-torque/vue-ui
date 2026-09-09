import { mount, flushPromises } from '@vue/test-utils';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VImage from './VImage.vue';

afterEach(() => vi.restoreAllMocks());

describe('VImage', () => {
  it('keeps a lazy image mounted and shows a skeleton until its load event', async () => {
    const wrapper = mount(VImage, { props: { src: '/photo.jpg', alt: 'Fund', loading: 'lazy' } });
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.find('[data-slot="skeleton"]').exists()).toBe(true);
    expect(wrapper.get('img').attributes('loading')).toBe('lazy');
    expect(wrapper.get('img').attributes('style')).not.toContain('display: none');
    await wrapper.get('img').trigger('load');
    expect(wrapper.find('[data-slot="skeleton"]').exists()).toBe(false);
    expect(wrapper.attributes('aria-busy')).toBe('false');
    expect(wrapper.emitted('loading:src')).toEqual([[true], [false]]);
    expect(wrapper.emitted('load')).toHaveLength(1);
  });

  it('forwards native image attributes and keeps frame styling off the image', () => {
    const wrapper = mount(VImage, {
      props: { src: '/photo.jpg', srcset: '/photo.jpg 640w', sizes: '55px', alt: '', fetchpriority: 'high' },
      attrs: { class: 'thumbnail object-cover', style: 'width: 55px; height: 55px', 'data-testid': 'photo', width: 55, height: 55 },
    });
    expect(wrapper.classes()).toContain('thumbnail');
    expect(wrapper.get('img').classes()).not.toContain('thumbnail');
    expect(wrapper.get('img').attributes()).toMatchObject({ src: '/photo.jpg', srcset: '/photo.jpg 640w', sizes: '55px', alt: '', fetchpriority: 'high', 'data-testid': 'photo', width: '55', height: '55' });
  });

  it('settles images already loaded before hydration/mount', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(100);
    const wrapper = mount(VImage, { props: { src: '/cached.svg', alt: 'Cached' } });
    await nextTick();
    expect(wrapper.attributes('aria-busy')).toBe('false');
    expect(wrapper.get('img').attributes('src')).toBe('/cached.svg');
  });

  it.each(['src', 'srcset', 'sizes'] as const)('restarts loading when %s changes and ignores the old image event', async (field) => {
    const wrapper = mount(VImage, { props: { src: '/old.jpg', srcset: '/old.jpg 640w', sizes: '55px', alt: 'Fund' } });
    const oldImage = wrapper.get('img');
    await oldImage.trigger('load');
    await wrapper.setProps({ [field]: field === 'sizes' ? '100px' : '/new.jpg' });
    expect(wrapper.attributes('aria-busy')).toBe('true');
    await oldImage.trigger('load');
    expect(wrapper.attributes('aria-busy')).toBe('true');
    await wrapper.get('img').trigger('load');
    expect(wrapper.attributes('aria-busy')).toBe('false');
  });

  it('uses a fallback without responsive candidates after failure and recovers on a new source', async () => {
    const wrapper = mount(VImage, { props: { src: '/missing.jpg', srcset: '/missing.jpg 640w', sizes: '55px', alt: 'Fund', fallbackSrc: '/fallback.svg' } });
    await wrapper.get('img').trigger('error');
    expect(wrapper.attributes('aria-busy')).toBe('false');
    expect(wrapper.attributes('data-fallback')).toBe('true');
    expect(wrapper.get('img').attributes('src')).toBe('/fallback.svg');
    expect(wrapper.get('img').attributes('srcset')).toBeUndefined();
    expect(wrapper.get('img').attributes('sizes')).toBeUndefined();
    await wrapper.get('img').trigger('error');
    expect(wrapper.get('img').attributes('src')).toBe('/fallback.svg');
    await wrapper.setProps({ src: '/recovered.jpg' });
    expect(wrapper.attributes('data-fallback')).toBe('false');
    expect(wrapper.attributes('aria-busy')).toBe('true');
  });

  it('does not leave an empty or failed eager image loading forever', async () => {
    const empty = mount(VImage, { props: { alt: 'Unavailable' } });
    expect(empty.attributes('data-fallback')).toBe('true');
    expect(empty.attributes('aria-busy')).toBe('false');
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0);
    const broken = mount(VImage, { props: { src: '/broken.jpg', alt: 'Unavailable' } });
    await flushPromises();
    expect(broken.attributes('data-fallback')).toBe('true');
    expect(broken.attributes('aria-busy')).toBe('false');
  });

  it('keeps an explicit host loading state until it is cleared', async () => {
    const wrapper = mount(VImage, { props: { src: '/photo.jpg', alt: 'Fund', isLoading: true } });
    await wrapper.get('img').trigger('load');
    expect(wrapper.attributes('aria-busy')).toBe('true');
    await wrapper.setProps({ isLoading: false });
    expect(wrapper.attributes('aria-busy')).toBe('false');
  });

  it('renders both the image source and skeleton during SSR without browser globals', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(VImage, { src: '/photo.jpg', alt: 'Fund' }) }));
    expect(html).toContain('src="/photo.jpg"');
    expect(html).toContain('data-slot="skeleton"');
    expect(html).toContain('aria-busy="true"');
  });
});
