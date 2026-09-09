# @global-torque/ui-primitives

Accessible Vue primitives with host-owned Tailwind themes.

Prepared `0.1.0` source-SFC candidate. This version is not advertised as an npm
release until its release report records publication. Install the reviewed
`.tgz` during candidate verification, with Vue 3.5 and Reka UI 2.10.

## Consumer setup

Use Vite with `@vitejs/plugin-vue`, Tailwind CSS 4 and its Vite plugin.
Components ship as editable TypeScript and Vue source. A raw Node import of a
`.vue` entry is unsupported; use a Vue-aware SSR build with these packages in
`ssr.noExternal`. No source aliases or private workspace checkout are needed.

```css
@import 'tailwindcss';
@import '@global-torque/design-tokens/css';
@import '@global-torque/ui-primitives/styles/theme';
```

The host supplies shadcn theme roles (`--background`, `--foreground`, `--primary`,
`--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`,
`--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`,
`--border`, `--input`, `--ring`, `--radius`) and a font. Use a class or
`data-theme="dark"` for dark mode. No product preset, font or logo is installed.
The starter includes a complete neutral example theme. Theme styles register
package files as Tailwind sources; retain the imports during CSS compilation.

## Supported imports

- `@global-torque/ui-primitives/accordion`
- `@global-torque/ui-primitives/alert`
- `@global-torque/ui-primitives/avatar`
- `@global-torque/ui-primitives/badge`
- `@global-torque/ui-primitives/breadcrumb`
- `@global-torque/ui-primitives/button`
- `@global-torque/ui-primitives/calendar`
- `@global-torque/ui-primitives/card`
- `@global-torque/ui-primitives/carousel`
- `@global-torque/ui-primitives/checkbox`
- `@global-torque/ui-primitives/collapsible`
- `@global-torque/ui-primitives/combobox`
- `@global-torque/ui-primitives/command`
- `@global-torque/ui-primitives/dialog`
- `@global-torque/ui-primitives/dropdown-menu`
- `@global-torque/ui-primitives/empty`
- `@global-torque/ui-primitives/field`
- `@global-torque/ui-primitives/input`
- `@global-torque/ui-primitives/input-group`
- `@global-torque/ui-primitives/input-otp`
- `@global-torque/ui-primitives/label`
- `@global-torque/ui-primitives/lib/utils`
- `@global-torque/ui-primitives/native-select`
- `@global-torque/ui-primitives/navigation-menu`
- `@global-torque/ui-primitives/popover`
- `@global-torque/ui-primitives/progress`
- `@global-torque/ui-primitives/radio-group`
- `@global-torque/ui-primitives/select`
- `@global-torque/ui-primitives/separator`
- `@global-torque/ui-primitives/sheet`
- `@global-torque/ui-primitives/sidebar`
- `@global-torque/ui-primitives/skeleton`
- `@global-torque/ui-primitives/sonner`
- `@global-torque/ui-primitives/spinner`
- `@global-torque/ui-primitives/stepper`
- `@global-torque/ui-primitives/styles/theme`
- `@global-torque/ui-primitives/switch`
- `@global-torque/ui-primitives/table`
- `@global-torque/ui-primitives/tabs`
- `@global-torque/ui-primitives/textarea`
- `@global-torque/ui-primitives/toggle`
- `@global-torque/ui-primitives/toggle-group`
- `@global-torque/ui-primitives/tooltip`

```vue
<script setup lang="ts">
import { Button } from '@global-torque/ui-primitives/button';
</script>
<template><Button type="button" @click="$emit('save')">Save changes</Button></template>
```

Components retain the shadcn-vue/Reka props, slots and accessible keyboard
contracts recorded in UPSTREAM.md. Supply accessible names for controls and
Dialog titles/descriptions; keep focus management enabled. Calendar's date
runtime is declared. Charts are excluded from this initial public API: the current Unovis dependency
requires a MapLibre release with an unresolved critical advisory (GHSA-jrc7-96c5-q579).
They remain an internal feature until a supported patched dependency path is verified.
Component behavior tests and the public workbench document supported states.

## Maintenance

Global Torque frontend maintainers own the package. See LICENSE, NOTICE.md,
SUPPORT.md, SECURITY.md and CHANGELOG.md. Run type and behavior tests, then
verify the exact artifact in npm/pnpm, browser and SSR consumers before release.
