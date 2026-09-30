# Upstream attribution

The component files are copies of shadcn-vue, style `reka-vega`, changed only
in their imports. This file records where they come from and how to update
them.

| | |
|---|---|
| Repository | `unovue/shadcn-vue`, branch `dev`, commit `67c9a39` (2026-09-22) |
| Components | `apps/v4/styles/reka-vega/ui/<component>/` → `src/<component>/`, all 41 folders |
| `cn()` | `apps/v4/registry/bases/reka/lib/utils.ts` → `src/lib/utils.ts` |
| Tailwind helpers | `packages/cli/src/tailwind.css` (published as `shadcn-vue/tailwind.css`) → `src/styles/shadcn-vue-tailwind.css` |

## Local changes

Two import replacements in the component files, because consuming apps compile
this package from source, where `@/` means the app's own folder:

- `'@/lib/utils'` → `'../lib/utils'`;
- `'@/styles/reka-vega/ui/` → `'../`, including deep imports such as
  `'@/styles/reka-vega/ui/sheet/SheetTitle.vue'`.

There are no other local changes. The shadcn marker classes (`cn-menu-target`,
`cn-menu-translucent`, `cn-rtl-flip`, `cn-font-heading`) stay as upstream has
them; nothing styles them here. Our own files are `src/styles/theme.css` (our
colours in the standard shadcn theme layout) and the `*.spec.ts` tests.

## Updating

1. In the 41 component folders, delete every file except `*.spec.ts` and copy
   in the upstream folder's files from a newer commit. Copy `lib/utils.ts` and
   `packages/cli/src/tailwind.css` the same way.
2. Apply the same two import replacements.
3. Review `git diff`: it shows exactly what upstream changed.
4. Run `pnpm check` and update the commit above.

We do not use the shadcn-vue CLI: it writes only tsconfig-alias (`@/…`)
imports, and for the new styles it adds the whole `shadcn-vue` package as a
dependency.
