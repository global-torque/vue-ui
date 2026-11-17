/* eslint-disable vue/one-component-per-file */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScrollerVisibility,
} from '.';

class MutationObserverMock {
  static instances: MutationObserverMock[] = [];

  readonly disconnect = vi.fn();
  readonly observe = vi.fn();

  constructor(readonly callback: MutationCallback) {
    MutationObserverMock.instances.push(this);
  }
}

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];

  readonly disconnect = vi.fn();
  readonly observe = vi.fn();

  constructor(readonly callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this);
  }
}

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];

  readonly disconnect = vi.fn();
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();

  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit = {},
  ) {
    IntersectionObserverMock.instances.push(this);
  }

  trigger(entries: IntersectionObserverEntry[]) {
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

function rectangle(top: number, bottom: number): DOMRect {
  return {
    bottom,
    height: bottom - top,
    left: 0,
    right: 0,
    toJSON: () => ({}),
    top,
    width: 0,
    x: 0,
    y: top,
  };
}

function mountScroller(autoScroll = false) {
  return mount(MessageScrollerProvider, {
    props: { autoScroll },
    slots: {
      default: () => h(MessageScroller, () => [
        h(MessageScrollerViewport, () => h(MessageScrollerContent, () => h(
          MessageScrollerItem,
          { messageId: 'message-1', scrollAnchor: true },
          () => 'First message',
        ))),
        h(MessageScrollerButton, { behavior: 'auto', direction: 'end' }),
      ]),
    },
  });
}

function setScrollerGeometry(wrapper: ReturnType<typeof mount>) {
  const viewport = wrapper.get('[data-slot="message-scroller-viewport"]').element as HTMLElement;
  const item = wrapper.get('[data-slot="message-scroller-item"]').element as HTMLElement;
  let scrollTop = 0;
  let scrollHeight = 300;
  const scrollTo = vi.fn(({ top }: ScrollToOptions) => {
    scrollTop = top ?? 0;
  });

  Object.defineProperties(viewport, {
    clientHeight: { configurable: true, value: 100 },
    scrollHeight: { configurable: true, get: () => scrollHeight },
    scrollTop: {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => { scrollTop = value; },
    },
  });
  Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo });
  vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue(rectangle(0, 100));
  vi.spyOn(item, 'getBoundingClientRect').mockImplementation(() => rectangle(-scrollTop, 300 - scrollTop));

  return {
    scrollTo,
    setScrollHeight: (value: number) => { scrollHeight = value; },
    viewport,
  };
}

function appendMessage(wrapper: ReturnType<typeof mount>, messageId: string) {
  const content = wrapper.get('[data-slot="message-scroller-content"]').element;
  const spacer = wrapper.get('[data-message-scroller-spacer]').element;
  const appended = document.createElement('div');
  appended.dataset.messageId = messageId;
  content.insertBefore(appended, spacer);
}

function notifyMutation() {
  const observer = MutationObserverMock.instances[0];
  if (!observer)
    throw new Error('MutationObserver was not created.');
  observer.callback([], observer as unknown as MutationObserver);
}

function flushAnimationFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

const VisibilityConsumer = defineComponent({
  setup() {
    const visibility = useMessageScrollerVisibility();
    return () => h('output', { 'aria-label': 'Visible messages' }, visibility.value.visibleMessageIds.join(','));
  },
});

function mountVisibilityScroller() {
  let replaceViewport: () => void = () => {};
  const Harness = defineComponent({
    setup() {
      const viewportKey = ref('first');
      replaceViewport = () => { viewportKey.value = 'second'; };
      return () => {
        const viewport = h(MessageScrollerViewport, { key: viewportKey.value }, {
          default: () => h(MessageScrollerContent, null, {
            default: () => h(MessageScrollerItem, { messageId: 'message-1' }, () => 'First message'),
          }),
        });
        const scroller = h(MessageScroller, null, {
          default: () => [viewport, h(VisibilityConsumer)],
        });
        return h(MessageScrollerProvider, { autoScroll: false }, {
          default: () => scroller,
        });
      };
    },
  });

  const wrapper = mount(Harness);
  return { replaceViewport: () => replaceViewport(), wrapper };
}

afterEach(() => {
  MutationObserverMock.instances = [];
  ResizeObserverMock.instances = [];
  IntersectionObserverMock.instances = [];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('MessageScroller', () => {
  it('provides one live-message log with stable item and anchor identities', () => {
    const wrapper = mountScroller();

    expect(wrapper.findAll('[role="log"]')).toHaveLength(1);
    expect(wrapper.get('[role="log"]').attributes('aria-relevant')).toBe('additions');
    expect(wrapper.get('[data-slot="message-scroller-item"]').attributes('data-message-id')).toBe('message-1');
    expect(wrapper.get('[data-slot="message-scroller-item"]').attributes('data-scroll-anchor')).toBe('true');
  });

  it('exposes an active end button and scrolls to the end when the log overflows', async () => {
    const wrapper = mountScroller();
    const { scrollTo, viewport } = setScrollerGeometry(wrapper);

    await wrapper.get('[data-slot="message-scroller-viewport"]').trigger('scroll');
    await nextTick();

    const button = wrapper.get('[data-slot="message-scroller-button"]');
    expect(button.attributes('data-active')).toBe('true');

    await button.trigger('click');

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', top: 200 });
    expect(viewport.scrollTop).toBe(200);
  });

  it('does not follow appended content when auto-scroll is disabled and disconnects observers', async () => {
    vi.stubGlobal('MutationObserver', MutationObserverMock as unknown as typeof MutationObserver);
    vi.stubGlobal('ResizeObserver', ResizeObserverMock as unknown as typeof ResizeObserver);
    const wrapper = mountScroller(false);
    const { scrollTo } = setScrollerGeometry(wrapper);
    appendMessage(wrapper, 'message-2');
    scrollTo.mockClear();

    notifyMutation();
    await nextTick();

    expect(scrollTo).not.toHaveBeenCalled();

    wrapper.unmount();

    expect(MutationObserverMock.instances).toHaveLength(1);
    expect(ResizeObserverMock.instances).toHaveLength(2);
    expect(MutationObserverMock.instances.every((observer) => observer.disconnect.mock.calls.length === 1)).toBe(true);
    expect(ResizeObserverMock.instances.every((observer) => observer.disconnect.mock.calls.length === 1)).toBe(true);
  });

  it('keeps following after no-op wheel and ArrowDown input at the live edge', async () => {
    vi.stubGlobal('MutationObserver', MutationObserverMock as unknown as typeof MutationObserver);
    vi.stubGlobal('ResizeObserver', ResizeObserverMock as unknown as typeof ResizeObserver);
    const wrapper = mountScroller(true);
    const { scrollTo, setScrollHeight, viewport } = setScrollerGeometry(wrapper);
    const viewportWrapper = wrapper.get('[data-slot="message-scroller-viewport"]');

    viewport.scrollTop = 200;
    await viewportWrapper.trigger('scroll');
    await viewportWrapper.trigger('wheel', { deltaY: 40 });
    setScrollHeight(400);
    appendMessage(wrapper, 'message-2');
    notifyMutation();

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', top: 300 });

    scrollTo.mockClear();
    await viewportWrapper.trigger('keydown', { key: 'ArrowDown' });
    setScrollHeight(500);
    appendMessage(wrapper, 'message-3');
    notifyMutation();

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', top: 400 });
  });

  it('releases following after genuine upward movement during programmatic autoscrolling', async () => {
    vi.stubGlobal('MutationObserver', MutationObserverMock as unknown as typeof MutationObserver);
    vi.stubGlobal('ResizeObserver', ResizeObserverMock as unknown as typeof ResizeObserver);
    const wrapper = mountScroller(true);
    const { scrollTo, setScrollHeight, viewport } = setScrollerGeometry(wrapper);
    const viewportWrapper = wrapper.get('[data-slot="message-scroller-viewport"]');

    viewport.scrollTop = 200;
    await viewportWrapper.trigger('scroll');
    setScrollHeight(400);
    appendMessage(wrapper, 'message-2');
    notifyMutation();
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', top: 300 });

    scrollTo.mockClear();
    await viewportWrapper.trigger('wheel', { deltaY: -40 });
    viewport.scrollTop = 150;
    await viewportWrapper.trigger('scroll');
    setScrollHeight(500);
    appendMessage(wrapper, 'message-3');
    notifyMutation();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('replaces visibility observation without retaining stale observer callbacks', async () => {
    vi.stubGlobal('MutationObserver', MutationObserverMock as unknown as typeof MutationObserver);
    vi.stubGlobal('ResizeObserver', ResizeObserverMock as unknown as typeof ResizeObserver);
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock as unknown as typeof IntersectionObserver);
    const { replaceViewport, wrapper } = mountVisibilityScroller();
    const oldViewport = wrapper.get('[role="region"]').element;
    const oldItem = wrapper.get('[data-message-id="message-1"]').element;
    const oldObserver = IntersectionObserverMock.instances[0];

    if (!oldObserver)
      throw new Error('Initial IntersectionObserver was not created.');
    expect(oldObserver.options.root).toBe(oldViewport);

    replaceViewport();
    await nextTick();
    await nextTick();

    const newViewport = wrapper.get('[role="region"]').element;
    const newItem = wrapper.get('[data-message-id="message-1"]').element;
    const newObserver = IntersectionObserverMock.instances[1];
    if (!newObserver)
      throw new Error('Replacement IntersectionObserver was not created.');

    expect(oldObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(newObserver.options.root).toBe(newViewport);

    oldObserver.trigger([{ isIntersecting: true, target: oldItem } as IntersectionObserverEntry]);
    await flushAnimationFrame();
    expect(wrapper.get('output').text()).toBe('');

    newObserver.trigger([{ isIntersecting: true, target: newItem } as IntersectionObserverEntry]);
    await flushAnimationFrame();
    expect(wrapper.get('output').text()).toBe('message-1');
  });
});
