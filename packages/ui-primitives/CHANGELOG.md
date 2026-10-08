# Changelog

## 0.2.0 — shadcn-vue Vega

- Breaking: every component is now the verbatim shadcn-vue `reka-vega` file
  (commit `67c9a39`, see UPSTREAM.md); all local component edits are gone.
  Classes, spacing, radii and popup animations follow Vega.
- Breaking: `styles/contract` and the `@global-torque/design-tokens` dependency
  are removed. `styles/theme` declares no values: it maps the shadcn variables
  and the `--success`, `--warning` and `--info` pairs (each with `-foreground`)
  for Tailwind, and the host provides the values, normally through
  `@global-torque/design-tokens/css`, so import order does not matter. It sets
  no font and imports `shadcn-vue-tailwind.css` (upstream
  `shadcn-vue/tailwind.css`: the `data-open:`, `data-closed:`, `data-active:`…
  variants Vega uses, and `no-scrollbar`). `--brand-*` seeds are not read.
- Breaking: the size tokens are gone (`--spacing-control-*`, `--text-control*`,
  `--radius-control`, `--font-weight-control`, `--spacing-table-cell`,
  `--text-table*`, `--font-weight-table-head`, `--color-table-head-foreground`,
  `--color-control-background`), so utilities such as `h-control-md`,
  `rounded-control`, `text-control` and `bg-control-background` no longer
  exist. `cn()` is the standard `twMerge(clsx(...))`.
- Breaking: the radius scale follows shadcn (`--radius-sm` = 0.6 × `--radius`
  up to `--radius-4xl`), and `dark:` styles apply only under a `.dark`
  ancestor, no longer under `[data-theme='dark']`.
- Breaking: portaled dialog, select, popover, menu, tooltip and combobox
  surfaces use `z-50`; `--ui-dialog-z-index` and `--ui-select-popup-z-index`
  are no longer read.
- Breaking component APIs: `SelectTrigger` has sizes `sm` and `default` only
  and no `icon` slot; `Tabs` has no `variant` prop and `TabsVariant` is gone
  (set `variant="line"` on `TabsList`; the list no longer scrolls); Alert has
  only the `default` and `destructive` variants; `SidebarProvider` has no
  `persistState` or `keyboardShortcut` props, treats `max-width: 768px` as
  mobile and reads the `sidebar_state` cookie once, when the module loads;
  `Sidebar` no longer emits `openAutoFocus`; `./sonner` no longer re-exports
  `toast` (import it from `vue-sonner`); Stepper parts and
  `DialogScrollContent` set no `data-slot` attributes.
- Added: `AlertAction`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`,
  `PopoverHeader`, `PopoverTitle`, `PopoverDescription`, `tabsListVariants`
  and `avatarVariants`; Badge `ghost` and `link` variants; Card and Avatar
  sizes.

## 0.1.4 — shared portal layer candidate

- Portaled dialog, select, popover, menu, tooltip and combobox surfaces now use
  the host-controlled `--ui-dialog-z-index` layer, defaulting to `1100`, while
  select supports the more specific `--ui-select-popup-z-index` override.
- Caller `z-*` classes continue to replace the shared defaults through the
  public `cn` merge helper; Sheet and NavigationMenu layers remain unchanged.

## 0.1.3 — prepared candidate

- pnpm consumers pin inter-package dependencies to the same reviewed archives.
- Versions 0.1.0 and 0.1.1 were not released: bridge installation and
  version-aware verification were corrected before this candidate.

- First independently consumable source-SFC package with explicit subpaths.
- Host-owned themes, navigation and state; no private runtime dependencies.
- Calendar declares its date runtime dependency. Brand presets remain private.
