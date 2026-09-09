export const LOCATION_CHANGE_EVENT = 'codex:locationchange';

const HISTORY_PATCHED_FLAG = '__codexLocationChangePatched__';

type WindowWithHistoryPatchFlag = Window & {
  [HISTORY_PATCHED_FLAG]?: boolean;
};

const dispatchLocationChange = () => {
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
};

const patchHistoryMethod = (method: 'pushState' | 'replaceState') => {
  const original = window.history[method].bind(window.history) as History['pushState'];
  const patchedMethod: History['pushState'] = (...args) => {
    original(...args);
    dispatchLocationChange();
  };

  window.history[method] = patchedMethod as History['pushState'] & History['replaceState'];
};

export const ensureLocationChangeHistoryPatched = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const patchedWindow = window as WindowWithHistoryPatchFlag;

  if (patchedWindow[HISTORY_PATCHED_FLAG]) {
    return;
  }

  patchHistoryMethod('pushState');
  patchHistoryMethod('replaceState');
  patchedWindow[HISTORY_PATCHED_FLAG] = true;
};
