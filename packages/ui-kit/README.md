# @global-torque/ui-kit

Generic Vue forms, images, URL state and composed controls.

Published `0.1.4` source-SFC release. Install the exact npm version with Vue
3.5 and Reka UI 2.10. The release selection is owned by this UI Kit package;
the historical curated `@global-torque/invest-widgets@0.1.3` registry release
is retained for existing consumers and is now owned by `torque-packages`.

## Consumer setup

Use Vite with `@vitejs/plugin-vue`, Tailwind CSS 4 and its Vite plugin.
Install Sass when compiling the composed form/grid styles.
Components ship as editable TypeScript and Vue source. A raw Node import of a
`.vue` entry is unsupported; use a Vue-aware SSR build with these packages in
`ssr.noExternal`. No source aliases or private workspace checkout are needed.

```css
@import 'tailwindcss';
@import '@global-torque/design-tokens/css';
@import '@global-torque/ui-primitives/styles/theme';
@import '@global-torque/ui-kit/styles';
```

The host supplies shadcn theme roles (`--background`, `--foreground`, `--primary`,
`--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`,
`--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`,
`--border`, `--input`, `--ring`, `--radius`) and a font. Use a class or
`data-theme="dark"` for dark mode. No product preset, font or logo is installed.
The starter includes a complete neutral example theme. Theme styles register
package files as Tailwind sources; retain the imports during CSS compilation.

## Supported imports

- `@global-torque/ui-kit/badge-tone`
- `@global-torque/ui-kit/breakpoints`
- `@global-torque/ui-kit/file-uploader`
- `@global-torque/ui-kit/filter`
- `@global-torque/ui-kit/form`
- `@global-torque/ui-kit/form-validation`
- `@global-torque/ui-kit/image`
- `@global-torque/ui-kit/pagination`
- `@global-torque/ui-kit/query-dialog`
- `@global-torque/ui-kit/styles/mixins`
- `@global-torque/ui-kit/timeline`
- `@global-torque/ui-kit/url-sync`
- `@global-torque/ui-kit/url-synced-tabs`
- `@global-torque/ui-kit/styles`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { VFormGroup, VFormInput } from '@global-torque/ui-kit/form';
import { VImage } from '@global-torque/ui-kit/image';
const name = ref('');
</script>
<template>
  <VFormGroup label="Display name"><VFormInput v-model="name" /></VFormGroup>
  <VImage src="/cover.svg" alt="Project overview" style="aspect-ratio: 16 / 9" />
</template>
```

Form fields use controlled `modelValue` / `update:modelValue`; the host supplies
validation errors to `VFormGroup`. Checkbox groups emit detached selections.
`VImage` reserves host-specified dimensions, reports loading and native events,
and handles errors with neutral fallback artwork. URL composables synchronize
host-owned query keys; `useReactiveQuery(initialSearch)` supports request-local
SSR state, attaches browser observers on mount and removes listeners on unmount.
`useSyncWithUrl` accepts explicit parser/serializer and optional router adapters.
Uploader callbacks own persistence; widgets do not choose API endpoints.
Timeline router-link rendering requires the host to register that component.

Private compliance validation rules, schema reference defaults, branding helpers
and wildcard/deep imports are intentionally absent. Define product validation
and eligibility in the consuming application. This release is not a migration
facade for every historical internal UI export.

### Neutral form validation

`@global-torque/ui-kit/form-validation` exports `useFormValidation`, `useForm`,
`useFormErrors` and `scrollToError`. The composable uses a new standard AJV
instance per form and accepts optional `FormValidationOptions` hooks for a host
validator, schema composition and model preparation. Frontend schema values take
precedence over backend values during the default clone-and-compose operation;
both inputs remain unchanged. Product keywords, eligibility rules and reference
resolution belong in the consuming domain package and can be supplied through
the explicit hooks.

The validation helper is SSR-safe and clears both validation state and field
errors on reset or schema replacement. A Vue-aware Vite SSR build is required
for source-SFC consumers.

## Maintenance

Global Torque frontend maintainers own the package. See LICENSE, NOTICE.md,
SUPPORT.md, SECURITY.md and CHANGELOG.md. Run type and behavior tests, then
verify the exact artifact in npm/pnpm, browser and SSR consumers before release.
