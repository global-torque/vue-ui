import { onMounted, onUnmounted, shallowRef } from 'vue';
import {
  ensureLocationChangeHistoryPatched,
  LOCATION_CHANGE_EVENT,
} from './locationChange';

const getCurrentLocationPath = (fallbackPath = '/') => {
  if (typeof window === 'undefined') {
    return fallbackPath;
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export function useReactiveLocation(fallbackPath = '/') {
  const locationPath = shallowRef(getCurrentLocationPath(fallbackPath));

  const syncLocationPath = () => {
    locationPath.value = getCurrentLocationPath(fallbackPath);
  };

  onMounted(() => {
    ensureLocationChangeHistoryPatched();
    syncLocationPath();
    window.addEventListener('popstate', syncLocationPath);
    window.addEventListener('hashchange', syncLocationPath);
    window.addEventListener(LOCATION_CHANGE_EVENT, syncLocationPath);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', syncLocationPath);
    window.removeEventListener('hashchange', syncLocationPath);
    window.removeEventListener(LOCATION_CHANGE_EVENT, syncLocationPath);
  });

  return locationPath;
}
