import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ensureLocationChangeHistoryPatched, LOCATION_CHANGE_EVENT } from './locationChange';

/** Observe this browser's query; pass a request-local initial value for SSR. */
export function useReactiveQuery(initialSearch = '') {
  const query = ref(new URLSearchParams(initialSearch));
  const update = () => {
    query.value = new URLSearchParams(window.location.search);
  };

  onMounted(() => {
    ensureLocationChangeHistoryPatched();
    update();
    window.addEventListener('popstate', update);
    window.addEventListener(LOCATION_CHANGE_EVENT, update);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('popstate', update);
    window.removeEventListener(LOCATION_CHANGE_EVENT, update);
  });

  return query;
}
