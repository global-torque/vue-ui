# Public investment presentation

`@global-torque/invest-widgets` provides controlled offer cards and profile
selection for Vue applications. Prepared version `0.1.0` ships TypeScript and
Vue SFC source; install the reviewed artifact with Vue 3.5, Reka UI 2.10 and
the matching public UI packages. It needs no application store, router or SDK
inside the components. Host code supplies presentation data and handles intent.

Use a Vue-aware Vite client/SSR build, with the public UI packages in
`ssr.noExternal`. Follow the UI Primitives and UI Kit stylesheet instructions
and register this package's source with Tailwind. The developer starter shows
the complete configuration. Raw Node imports of `.vue` entries are unsupported.

## API

The public root exports the same symbols as the explicit `./offers` and
`./profiles` subpaths. The release must include their Vue components and styles.

- `./offers`: `OfferCard`, `OfferCardData`, `OfferCardImage`, `OfferCardFact`.
  `offer` contains a string ID, title, optional description, optional image
  with explicit alternative text, and optional host-formatted label/value facts.
  `loading` hides stale data; missing `offer` shows an empty state. `disabled`
  prevents activation. `actionLabel`, `loadingLabel` and `emptyLabel` customize
  visible text. Activating the button emits `select(id)`; it never navigates.
- `./profiles`: `ProfileSelector`, `ProfileSelectionItem`. `items` is a required
  readonly list of unique string IDs and labels, with optional descriptions and
  disabled flags. `selectedId` is host-controlled. `select(id)` requests a
  selection and never changes the supplied state. `loading` hides stale items;
  `disabled` disables all choices. `label`, `loadingLabel` and `emptyLabel`
  customize accessible and visible text. Choices are native buttons with
  `aria-pressed`, not a listbox with an implied arrow-key selection contract.

Neither widget installs providers, reads global user state, constructs URLs,
authenticates, formats financial amounts, or calls the SDK. The starter owns
SDK response mapping, loading/error state, eligibility, selection and routing.
Supply translated labels and formatted values from the host where needed.

```vue
<script setup lang="ts">
import { ref } from "vue";
import {
  OfferCard,
  type OfferCardData,
} from "@global-torque/invest-widgets/offers";
import { ProfileSelector } from "@global-torque/invest-widgets/profiles";

const selectedId = ref("personal");
const profiles = [{ id: "personal", label: "Personal account" }];
const offer: OfferCardData = {
  id: "example",
  title: "Example offer",
  facts: [{ label: "Minimum investment", value: "$500" }],
};
function showOffer(id: string) {
  // The host router or view model handles this intent.
  console.info(id);
}
</script>

<template>
  <ProfileSelector
    :items="profiles"
    :selected-id="selectedId"
    @select="selectedId = $event"
  />
  <OfferCard :offer="offer" @select="showOffer" />
</template>
```

## Styling and release proof

Widgets use scoped CSS and the public UI theme variables (`--background`,
`--foreground`, `--border`, `--radius`, `--accent`, `--accent-foreground`,
`--muted-foreground`) with neutral fallbacks. They do not need investment-shell
styles or legacy typography classes. The host must follow the public UI
Primitives/UI Kit setup for their base theme and Tailwind source scanning;
`OfferCard` uses UI Kit's `image` export and both widgets use the UI Primitives
`button` export. Branding belongs to the host.

Package tests cover loading/empty/disabled behavior, host-controlled selection,
two independent mounted apps, escaped presentation text, image inputs and
concurrent SSR without browser globals. Before publication, independently
verify desktop/mobile wrapping, keyboard and focus behavior, SSR/hydration and
the installed artifact's UI dependency closure. Unit tests using workspace
source do not establish that the assembled npm package is portable.

The intended first consumer is the external SDK starter. Existing private
Invest/Dashboard consumers are not silently migrated by this candidate.
