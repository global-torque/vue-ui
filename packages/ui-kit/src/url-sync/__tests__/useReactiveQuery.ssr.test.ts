// @vitest-environment node
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it } from 'vitest';
import { useReactiveQuery } from '../useReactiveQuery';

it('keeps query state local to concurrent server renders without browser globals', async () => {
  const render = (search: string) => renderToString(createSSRApp({
    setup() {
      const query = useReactiveQuery(search);
      return () => h('span', query.value.get('profile') ?? '');
    },
  }));
  expect(await Promise.all([render('?profile=one'), render('?profile=two')]))
    .toEqual(['<span>one</span>', '<span>two</span>']);
});
