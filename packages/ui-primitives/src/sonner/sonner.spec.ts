import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { toast } from 'vue-sonner';
import { Toaster } from '.';

describe('Toaster', () => {
  it('renders toasts raised through vue-sonner', async () => {
    const wrapper = mount(Toaster, { attachTo: document.body });
    toast.success('NAV published', { description: 'Unit price 102.35' });
    await flushPromises();

    const item = wrapper.get('[data-sonner-toast]');
    expect(item.attributes('data-type')).toBe('success');
    expect(item.text()).toContain('NAV published');
    expect(item.text()).toContain('Unit price 102.35');
    wrapper.unmount();
  });
});
