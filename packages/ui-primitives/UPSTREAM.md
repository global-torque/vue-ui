# Upstream attribution

The repository source files are copies of shadcn-vue, style `reka-vega`, changed
only in their imports and documented local adaptations. The package build
compiles the repository source into `dist/`, where the public ESM JavaScript and
declaration exports live. It also copies `styles/theme.css` into `dist/`; its
`@source "../"` directive scans the compiled `dist` output. This file records
where the source comes from and how to update it.

| | |
|---|---|
| Repository | `unovue/shadcn-vue`, branch `dev`, commit `67c9a39` (2026-09-22) |
| Components | `apps/v4/styles/reka-vega/ui/<component>/` → `src/<component>/`, all 41 folders |
| Chat components | `apps/v4/styles/reka-vega/ui/{bubble,message,message-scroller}/` → the matching `src/` folders, branch `dev`, commit `d1bf1b3a2d1a824b19f32d7253a28a43797b8253`; archive SHA-256 `d942e4a1614865729abb38edf5689e2f65f8b8268cd3cd3eecfafc1c2ebc8899` |
| `cn()` | `apps/v4/registry/bases/reka/lib/utils.ts` → `src/lib/utils.ts` |
| Tailwind helpers | `packages/cli/src/tailwind.css` (published as `shadcn-vue/tailwind.css`) → `src/styles/shadcn-vue-tailwind.css` |

## Local changes

Two import replacements in the repository source files, because `@/` refers to
the upstream app alias:

- `'@/lib/utils'` → `'../lib/utils'`;
- `'@/styles/reka-vega/ui/` → `'../`, including deep imports such as
  `'@/styles/reka-vega/ui/sheet/SheetTitle.vue'`.
- In the three chat component families, `'cn'` → `'../lib/utils'` and
  `'@/styles/reka-vega/ui/button'` → `'../button'`.

Bubble keeps all upstream variants. Its secondary and muted interactive hovers
use `bg-secondary/80` and `bg-muted/80`. Its tinted variant uses
`bg-accent text-accent-foreground` and `bg-accent/80` on interactive hover.
These substitutions use existing semantic classes instead of upstream color
functions or derived color values. No token values or declarations are added.

### MessageScroller functional divergences

The following fixes intentionally diverge from the pinned upstream source:

- **No-op input trigger:** A downward wheel or `ArrowDown` key can report user
  intent without moving the viewport. Affected ownership and symbols:
  `src/message-scroller/useMessageScroller.ts`,
  `createEngine().userScrollIntent`, `updateModeFromScroll`, and
  `syncAfterScroll`. Pinned upstream source:
  `apps/v4/styles/reka-vega/ui/message-scroller/` at commit
  `d1bf1b3a2d1a824b19f32d7253a28a43797b8253`. Rationale: keep
  `following-bottom` armed until measured movement leaves the live edge, while
  cancelling active programmatic-autoscrolling tracking so an upward movement
  during its timeout is honored. This addresses [upstream issue #1932](https://github.com/unovue/shadcn-vue/issues/1932).
  Refresh warning: reapply this behavior after every upstream refresh and
  recheck no-op input and live-edge transitions.
- **Viewport replacement trigger:** The viewport element identity can change
  while visibility consumers and message registrations remain active. Affected
  ownership and symbols: `src/message-scroller/useMessageScroller.ts`,
  `createEngine().setViewportElement`, `observeVisibility`, and
  `unobserveVisibility`. Pinned upstream source:
  `apps/v4/styles/reka-vega/ui/message-scroller/` at commit
  `d1bf1b3a2d1a824b19f32d7253a28a43797b8253`. Rationale: cancel pending
  visibility work, replace the observer root, clear derived visibility state,
  and ignore callbacks from disconnected observers without changing consumer
  counts or message registration. Refresh warning: reapply this lifecycle
  behavior after every upstream refresh and recheck observer replacement.

The calendar intentionally keeps its month and year sizing utilities on the
nested `select`, not the `NativeSelect` wrapper. Vega applies those utilities
to the wrapper, which places the chevron outside the select border and gives
the two elements different heights. Calendar week rows use a compact two-pixel
gap. Reapply and review both changes after every upstream component refresh.

The package also intentionally diverges from Vega's cursor classes. Enabled
native controls use a selector that excludes native, ARIA, data-disabled, and
unavailable states. Actionable Reka role items use a data-disabled-aware pointer
selector, and rendered select scroll controls use a pointer. This keeps disabled
and polymorphic non-action output from receiving an action cursor. Reapply and
review this cursor policy after every upstream component refresh.

The table empty state uses `py-4 sm:py-10` instead of Vega's `py-10`, keeping
mobile spacing compact while preserving the upstream spacing at `sm` and larger
breakpoints. Reapply and review this change after every upstream component
refresh.

`DialogContent` bounds normal dialogs to the viewport with a two-rem vertical
margin and scrolls overflow. Consumers can override the max height, such as
with `max-h-none` for a fullscreen dialog. Reapply and review this change after
every upstream component refresh.

Other than the local component changes documented above, there are no other
local changes to the upstream-copied component files. The shadcn marker classes (`cn-menu-target`,
`cn-menu-translucent`, `cn-rtl-flip`, `cn-font-heading`) stay as upstream has
them; nothing styles them here. Our own files are `src/styles/theme.css` (our
Tailwind mapping of the shadcn variables; no values) and the `*.spec.ts` tests.

## Updating

1. In each component folder, delete every file except `*.spec.ts` and copy in
   the upstream folder's files from its recorded commit. Copy `lib/utils.ts`
   and `packages/cli/src/tailwind.css` the same way when applicable.
2. Apply the documented relative-import replacements and review recorded local
   component deviations.
3. Review `git diff`: it shows exactly what upstream changed.
4. Run `pnpm check` and update the commit above.

We do not use the shadcn-vue CLI: it writes only tsconfig-alias (`@/…`)
imports, and for the new styles it adds the whole `shadcn-vue` package as a
dependency.
