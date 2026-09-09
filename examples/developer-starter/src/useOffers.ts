import { ref, onUnmounted } from 'vue';
import type { OfferCardData } from '@global-torque/invest-widgets/offers';

export function useOffers() {
  const offers = ref<OfferCardData[]>([]);
  const selected = ref<OfferCardData>();
  const loading = ref(false);
  const error = ref('');
  const mode = ref<'fixture' | 'live'>();
  const scenario = ref('success');
  let current: AbortController | undefined;
  let retryCommand: () => Promise<void>;
  async function read<T>(url: string, signal: AbortSignal): Promise<T> {
    const response = await fetch(url, { signal });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'The request could not be completed.');
    return body;
  }
  async function run(command: (signal: AbortSignal) => Promise<void>) {
    current?.abort();
    const request = new AbortController();
    current = request;
    loading.value = true;
    error.value = '';
    try { await command(request.signal); }
    catch (cause) { if (!request.signal.aborted) error.value = cause instanceof Error ? cause.message : 'The request could not be completed.'; }
    finally { if (current === request) loading.value = false; }
  }
  async function load() {
    retryCommand = load;
    selected.value = undefined;
    offers.value = [];
    await run(async (signal) => {
      const config = await read<{ mode: 'fixture' | 'live' }>('/api/config', signal);
      if (signal.aborted) return;
      mode.value = config.mode;
      const result = await read<{ offers: OfferCardData[] }>(`/api/offers?scenario=${encodeURIComponent(scenario.value)}`, signal);
      if (!signal.aborted) offers.value = result.offers;
    });
  }
  async function open(id: string) {
    retryCommand = () => open(id);
    selected.value = undefined;
    await run(async (signal) => {
      const result = await read<{ offer: OfferCardData }>(`/api/offers/${encodeURIComponent(id)}?scenario=${encodeURIComponent(scenario.value)}`, signal);
      if (!signal.aborted) selected.value = result.offer;
    });
  }
  const retry = () => retryCommand?.();
  onUnmounted(() => current?.abort());
  return { offers, selected, loading, error, mode, scenario, load, open, retry };
}
