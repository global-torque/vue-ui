import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOffersClient, readConfiguration } from '../server/offers.mjs';
import { createStarterServer } from '../server/index.mjs';

const fixture = readConfiguration({}, true);
test('live configuration is explicit and never falls back to fixtures', () => {
  assert.throws(() => readConfiguration({}), /STARTER_MODE/);
  const env = { STARTER_MODE: 'live', OFFERS_API_URL: 'https://sandbox.example.test', OFFERS_APPLICATION_AUTH: 'none', OFFERS_USER_AUTH: 'none' };
  assert.equal(readConfiguration(env).mode, 'live');
  assert.throws(() => readConfiguration({ ...env, OFFERS_API_URL: 'http://localhost:9000' }), /HTTPS/);
  assert.throws(() => readConfiguration({ ...env, OFFERS_APPLICATION_AUTH: 'api-key' }), /OFFERS_API_KEY/);
  assert.throws(() => readConfiguration({ ...env, OFFERS_USER_AUTH: 'bearer' }), /OFFERS_BEARER_TOKEN/);
});
test('framework-free example exercises the published SDK validators for list and detail', async () => {
  const client = createOffersClient(fixture);
  try {
    const result = await client.offers.listOffers({ limit: 2 });
    assert.equal(result.data.data.length, 2);
    const detail = await client.offers.getOffer({ slug: result.data.data[0].slug });
    assert.equal(detail.data.id, result.data.data[0].id);
    await assert.rejects(client.offers.getOffer({ slug: 'not-found' }));
  } finally { client.dispose(); }
});
test('HTTP boundary returns explicit demo states and only allowlisted public routes', async (t) => {
  const server = createStarterServer(fixture);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.deepEqual(await (await fetch(`${base}/api/config`)).json(), { mode: 'fixture' });
  const list = await (await fetch(`${base}/api/offers`)).json();
  assert.equal(list.offers.length, 2);
  assert.equal((await (await fetch(`${base}/api/offers/${list.offers[0].id}`)).json()).offer.id, list.offers[0].id);
  assert.deepEqual(await (await fetch(`${base}/api/offers?scenario=empty`)).json(), { offers: [] });
  assert.equal((await fetch(`${base}/api/offers?scenario=auth-error`)).status, 401);
  assert.equal((await fetch(`${base}/api/offers?scenario=error`)).status, 502);
  assert.equal((await fetch(`${base}/api/offers?scenario=invalid`)).status, 400);
  assert.equal((await fetch(`${base}/api/private`)).status, 404);
  assert.equal((await fetch(`${base}/api/offers`, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${base}/%2e%2e%2fserver/offers.mjs`)).status, 404);
});
test('server keeps application credentials private and refuses upstream redirects', async (t) => {
  const config = readConfiguration({ STARTER_MODE: 'live', OFFERS_API_URL: 'https://sandbox.example.test', OFFERS_APPLICATION_AUTH: 'api-key', OFFERS_API_KEY: 'test-only-app-key', OFFERS_USER_AUTH: 'bearer', OFFERS_BEARER_TOKEN: 'test-only-user-token' });
  const nativeFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith('https://sandbox.example.test')) {
      calls++;
      const headers = new Headers(init.headers);
      assert.equal(headers.get('X-API-Key'), 'test-only-app-key');
      assert.equal(headers.get('Authorization'), 'Bearer test-only-user-token');
      assert.equal(init.redirect, 'error');
      assert.equal(init.credentials, 'omit');
      return new Response(JSON.stringify({ message: 'test-only-app-key test-only-user-token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    return nativeFetch(input, init);
  };
  t.after(() => { globalThis.fetch = nativeFetch; });
  const server = createStarterServer(config);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.deepEqual(await (await fetch(`${base}/api/config`)).json(), { mode: 'live' });
  const response = await fetch(`${base}/api/offers?scenario=success`);
  assert.equal(response.status, 401);
  assert(!/test-only/.test(await response.text()));
  assert.equal(calls, 1);
  assert.equal((await fetch(`${base}/api/offers/%2Fprivate`)).status, 400);
  assert.equal((await fetch(`${base}/api/offers/%ZZ`)).status, 400);
});
