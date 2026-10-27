import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VUploader from './VUploader.vue';

enableAutoUnmount(afterEach);

describe('VUploader file input interactions', () => {
  it('opens the native file input once when the enabled dropzone itself is clicked', async () => {
    const wrapper = mount(VUploader);
    const inputClick = vi.spyOn(wrapper.get('input').element, 'click');

    await wrapper.get('.v-uploader__dropzone').trigger('click');

    expect(inputClick).toHaveBeenCalledTimes(1);
  });

  it('does not open the native file input from preview-card or preview-area interactions', async () => {
    const wrapper = mount(VUploader, {
      props: {
        preloadedItems: [{ name: 'document.pdf', url: '/document.pdf' }],
      },
    });
    const inputClick = vi.spyOn(wrapper.get('input').element, 'click');

    await wrapper.get('.v-uploader__preview-card').trigger('click');
    await wrapper.get('.v-uploader__preview').trigger('click');

    expect(inputClick).toHaveBeenCalledTimes(0);
  });

  it('opens the native file input once from the nested Upload button', async () => {
    const wrapper = mount(VUploader);
    const inputClick = vi.spyOn(wrapper.get('input').element, 'click');

    await wrapper.get('button').trigger('click');

    expect(inputClick).toHaveBeenCalledTimes(1);
  });
});
