import { inject, provide, type InjectionKey, type Ref } from "vue"

/** `default` is the shadcn pill list; `line` is a full-width list with a bottom
 * rule and an underlined active trigger (the tabs of the invest surface). */
export type TabsVariant = "default" | "line"

const TABS_VARIANT: InjectionKey<Ref<TabsVariant | undefined>> = Symbol("tabs-variant")

export function provideTabsVariant(variant: Ref<TabsVariant | undefined>) {
  provide(TABS_VARIANT, variant)
}

export function useTabsVariant(): Ref<TabsVariant | undefined> | undefined {
  return inject(TABS_VARIANT, undefined)
}
