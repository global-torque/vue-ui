import { ref, onMounted, onBeforeUnmount } from 'vue';

export const UI_BREAKPOINTS = Object.freeze({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const);

export const UI_LEGACY_BREAKPOINTS = Object.freeze({
  tablet: 768,
  desktop: 980,
  desktopMd: 1024,
  desktopLg: 1199,
} as const);

export type UiBreakpoint = keyof typeof UI_BREAKPOINTS;
export type UiLegacyBreakpoint = keyof typeof UI_LEGACY_BREAKPOINTS;

const BREAKPOINTS = {
  TABLET: UI_LEGACY_BREAKPOINTS.tablet,
  DESKTOP: UI_LEGACY_BREAKPOINTS.desktop,
  DESKTOP_MD: UI_LEGACY_BREAKPOINTS.desktopMd,
  DESKTOP_LG: UI_LEGACY_BREAKPOINTS.desktopLg,
};


let count = 0;
const isTablet = ref(false);
const isDesktop = ref(false);
const isDesktopMD = ref(false);
const isDesktopLG = ref(false);

export const useBreakpoints = () => {
  const onResize = () => {
    isTablet.value = window?.innerWidth < BREAKPOINTS.TABLET;
    isDesktop.value = window?.innerWidth >= BREAKPOINTS.DESKTOP;
    isDesktopMD.value = window?.innerWidth >= BREAKPOINTS.DESKTOP_MD;
    isDesktopLG.value = window?.innerWidth >= BREAKPOINTS.DESKTOP_LG;
  };

  onMounted(() => {
    count += 1;
    if (count > 1) return;

    onResize();
    window.addEventListener('resize', onResize, { passive: true });
  });

  onBeforeUnmount(() => {
    count -= 1;
    if (count > 0) return;
    window.removeEventListener('resize', onResize);
  });

  return {
    isTablet,
    isDesktop,
    isDesktopMD,
    isDesktopLG,
  };
};
