import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '.';

describe('Tooltip', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the content when open', async () => {
    const wrapper = mount(TooltipProvider, {
      attachTo: document.body,
      slots: {
        default: () => h(Tooltip, { defaultOpen: true }, () => [
          h(TooltipTrigger, () => 'Trigger'),
          h(TooltipContent, () => 'Helpful text'),
        ]),
      },
    });
    await nextTick();
    expect(document.querySelector('[data-slot="tooltip-trigger"]')?.textContent).toBe('Trigger');
    expect(document.querySelector('[data-slot="tooltip-content"]')?.textContent).toContain('Helpful text');
    wrapper.unmount();
  });
});
