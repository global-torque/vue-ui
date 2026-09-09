import { createInvestSdkTransport } from '@global-torque/sdk';
import { createOffersResource } from '@global-torque/sdk/resources/offers';

export const fixtureOffers = Object.freeze([
  Object.freeze({ id: 1, slug: 'community-energy', name: 'Community energy', seo_description: 'A fictional renewable-energy project for exploring the starter.', offering_currency: 'USD', min_investment: '500' }),
  Object.freeze({ id: 2, slug: 'neighborhood-workspaces', name: 'Neighborhood workspaces', seo_description: 'A fictional shared-workspace project. Demonstration data only.', offering_currency: 'USD', min_investment: '1000' }),
]);

export function readConfiguration(env, fixture = false) {
  if (fixture) return { mode: 'fixture', baseUrl: 'https://fixture.invalid', applicationAuth: 'none', userAuth: 'none' };
  if (env.STARTER_MODE !== 'live') throw new Error('Set STARTER_MODE=live with sandbox configuration, or explicitly run the demo command.');
  let url;
  try { url = new URL(env.OFFERS_API_URL); } catch { throw new Error('OFFERS_API_URL must be the provisioned HTTPS sandbox URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('OFFERS_API_URL must be HTTPS without embedded credentials, query or fragment.');
  if (!['none', 'api-key'].includes(env.OFFERS_APPLICATION_AUTH)) throw new Error('Set OFFERS_APPLICATION_AUTH to none or api-key.');
  if (!['none', 'bearer'].includes(env.OFFERS_USER_AUTH)) throw new Error('Set OFFERS_USER_AUTH to none or bearer.');
  if (env.OFFERS_APPLICATION_AUTH === 'api-key' && !env.OFFERS_API_KEY?.trim()) throw new Error('OFFERS_API_KEY is required for api-key mode.');
  if (env.OFFERS_USER_AUTH === 'bearer' && !env.OFFERS_BEARER_TOKEN?.trim()) throw new Error('OFFERS_BEARER_TOKEN is required for bearer mode.');
  return { mode: 'live', baseUrl: url.href, applicationAuth: env.OFFERS_APPLICATION_AUTH, userAuth: env.OFFERS_USER_AUTH, apiKey: env.OFFERS_API_KEY, bearerToken: env.OFFERS_BEARER_TOKEN };
}

export function createOffersClient(config, scenario = 'success') {
  const fixtureFetch = async (input, init) => {
    const request = new Request(input, init);
    if (scenario === 'slow') await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 1200);
      request.signal.addEventListener('abort', () => { clearTimeout(timer); reject(request.signal.reason); }, { once: true });
    });
    if (request.signal.aborted) throw request.signal.reason;
    if (scenario === 'error') return new Response('{}', { status: 503 });
    if (scenario === 'auth-error') return new Response('{}', { status: 401 });
    const url = new URL(request.url);
    const detail = url.pathname.match(/^\/public\/offer\/([^/]+)$/);
    const item = detail && fixtureOffers.find((offer) => offer.slug === decodeURIComponent(detail[1]));
    const body = detail ? item : { data: scenario === 'empty' ? [] : fixtureOffers, count: scenario === 'empty' ? 0 : fixtureOffers.length };
    return new Response(JSON.stringify(body ?? {}), { status: detail && !item ? 404 : 200, headers: { 'Content-Type': 'application/json' } });
  };
  const transport = createInvestSdkTransport({
    ...(config.mode === 'fixture' ? { fetch: fixtureFetch } : {}),
    apiKey: config.applicationAuth === 'api-key' ? config.apiKey : undefined,
    services: { offers: { baseUrl: config.baseUrl, applicationAuth: config.applicationAuth, auth: config.userAuth === 'bearer' ? { kind: 'bearer', getToken: () => config.bearerToken, credentials: 'omit' } : { kind: 'none', credentials: 'omit' } } },
    timeoutMs: 10000,
    retry: { maxRetries: 0 },
  });
  return { offers: createOffersResource(transport.createServiceClient('offers')), dispose: () => transport.dispose() };
}

export function presentOffer(offer, fixture = false) {
  return { id: offer.slug, title: offer.name || offer.title || `Offer ${offer.id}`, description: offer.seo_description || '', ...(fixture ? { image: { src: `/illustration.svg`, alt: 'Abstract illustration of a demonstration project' } } : {}), facts: [{ label: 'Currency', value: offer.offering_currency || 'Not specified' }, { label: 'Minimum', value: offer.min_investment || 'Not specified' }] };
}
