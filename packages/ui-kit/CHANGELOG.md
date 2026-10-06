# Changelog

## 0.3.1 — OTP presentation and plain-tag GitHub release

- Breaking: `badge-tone` uses the status variables (`--success`, `--warning`,
  `--info`, `--destructive`) that `@global-torque/ui-primitives/styles/theme`
  maps and the host provides (normally `@global-torque/design-tokens/css`), and
  no longer reads `--color-status-*` (or its
  `--chart-2` to `--chart-4` fallbacks) or `--color-badge-foreground`, so a host
  that coloured badges through those gets the fixed status colours. Solid tones
  get the matching `-foreground` text (`text-success-foreground`, …); soft
  tones keep the same opaque tint, their status colour mixed with
  `--background` at 20% (`success-soft`), 10% (`warning-soft`,
  `danger-soft`) or 5% (`info-soft`), under `text-foreground` instead of the
  muted text. `neutral` and `primary-soft` also move from the muted text to
  `text-foreground` on the same backgrounds. Tone names are unchanged.
- Breaking: the `VFormInputPassword` strength meter paints scores 1–4 with
  `--destructive`, `--warning`, a 50% mix of `--success` and `--warning`, and
  `--success`. On the default palette that is `#ff7070`, `#f1af32`, `#97c665`
  and `#3ddc97`, replacing `#ff5252`, `#eec32d`, `#a6cd0c` and `#00d395`. The
  hooks `--ui-password-strength-weak`, `-fair`, `-good` and `-strong` are
  removed, so a host that sets them no longer changes the meter; UI Kit now
  reads no `--ui-*` variable.
- `VFormInputOtp` centres the code in the field and, from the `sm` breakpoint
  (640px), renders 44px slots with `text-lg` digits. Below `sm` the slots keep
  the shadcn `size-9` (36px) and `text-sm`.
- Plain `vX.Y.Z` tags now select UI Kit and publish its attested GitHub release;
  npm publication remains a separate maintainer operation.

## 0.3.0 — scoped shadcn styles candidate

- Breaking: `VForm` is removed from `@global-torque/ui-kit/form`; render a
  native `<form novalidate>` instead.
- Breaking: components no longer read the `--ui-*` hook variables and always
  render the value each hook fell back to. The one exception is the
  `VTimelineCard` divider, which uses the `--border` token instead of its
  literal `rgb(51 51 51 / 10%)` fallback. Only the four
  `--ui-password-strength-*` colours of `VFormInputPassword` remain.
  `VFormSelect`, `VFormDatePicker` and `VFormTextarea` lose their hook-only
  layout, readonly and disabled rules, and the date picker trigger renders the
  standard `data-slot="popover-trigger"` instead of `input`.
- Breaking: the skin colour roles `--color-text-meta`, `--color-text-strong`,
  `--color-accent-strong`, `--color-border-strong`, `--color-control-border`,
  `--shadow-dialog` and `--shadow-control` are no longer read; their shadcn
  fallbacks apply. `badge-tone` still reads `--color-status-*` and
  `--color-badge-foreground`.
- Breaking: `./styles` (`src/public-theme.css`) only registers the package
  files as Tailwind sources. Its nine `--ui-*` values and its timeline
  `.is--h6__title` and uploader `.is--small` font rules are gone, so a host
  that imports it now gets the component fallbacks: a `--muted` filter
  dropdown with the `--foreground`-mixed shadow and `--primary-foreground`
  text on filled timeline cards.
- Breaking: `./styles/mixins` keeps `$breakpoints`, `get-breakpoint`,
  `media-lt`, `media-lte`, `media-gt` and `media-gte`; `media-between`,
  `media`, `mt`, `font`, `sizeInRem` and `isImportant` are removed.
- Breaking: every component style block is scoped. Template class names of the
  remaining components are unchanged, but ui-kit rules no longer reach elements
  outside their component and carry an extra attribute selector, so a host
  override needs at least the same specificity. `VFilter` reads
  `--v-filter-dropdown-min-width` with a 150px fallback inside the dropdown
  rule, so a host override on the component root still applies, and drops its
  `.v-form-checkbox .is--checked` rule and its redundant
  `.v-filter__button-icon` rule. `VTimelineCard` keeps highlight paragraph
  colours with `:deep(p)`.
- Breaking: `VFormCombobox` is now built from the ui-primitives (shadcn-vue
  Vega) Combobox. The field is a `role="combobox"` outline button with the
  `--input` border; it shows the selected label or the placeholder and is named
  by the field label. The list opens with a search field on top, an empty state
  ("No items found.") and a check on the selected item; filtering is reka's
  built-in text filter. `name` goes to the Combobox root, which renders a
  hidden input in native forms, as in `VFormSelect`. Other attributes (`id`,
  ARIA, `data-testid`, `class`) land on the trigger button. Props and the
  `icon` slot are unchanged, and the loading skeleton is `h-9`.
- Removed the source files no export reached: the internal `form/VSelect`,
  `form/VRadioGroup`, `form/VCombobox`, `VCheckbox` and `VInputOtp` parts
  (`VFormInputOtp` stays), `form/arrow.svg` and `form/fieldContext/types.ts`.
- `VFormRadio` with `row` lays the options out in a row again. This regressed
  in 0.2.0: the Vega `RadioGroup` is a grid, so the row classes had no effect.

## 0.2.0 — Vega primitives candidate

- Breaking: requires `@global-torque/ui-primitives` 0.2.0, the verbatim
  shadcn-vue Vega components and standard theme; its changes reach every
  composed control.
- Breaking: `VUrlSyncedTabs` has no `variant` prop; set `variant="line"` on the
  `TabsList` inside it.
- Breaking: `VFormSelect` has no `icon` slot; the standard chevron shows. Its
  `large` and `medium` sizes render the `default` trigger, `small` the `sm`
  trigger.
- Breaking: `VFormInput`, `VFormSelect`, `VFormDatePicker`, `VFormCombobox` and
  `VFormTextarea` no longer use the removed size tokens (`h-control-*`,
  `rounded-control`, `text-control`, `bg-control-background`); the primitives'
  standard heights and radii apply, and the `size` props of `VFormInput`,
  `VFormDatePicker` and `VFormCombobox` no longer change the height.
- VSelectContent and VComboboxContent use `z-50` instead of the
  `--ui-dialog-z-index` and `--ui-select-popup-z-index` layer; caller `z-*`
  classes still replace it through `cn`.

## 0.1.5 — shared portal layer candidate

- Component styles no longer carry fixed colour or shadow literals. Every value
  now reads the shadcn variable contract a host already themes — `--input`,
  `--border`, `--muted-foreground`, `--primary`, `--primary-foreground`,
  `--destructive`, `--background`, `--foreground` — either directly or as the
  terminal of an optional host role variable. The `--ui-*` hook names and their
  meaning are unchanged, so a host that already sets them sees no difference.
- **This changes what unhooked surfaces render.** Eighteen of the replaced
  declarations, across eleven components, carry no `--ui-*` hook, so no host
  setting holds them at their previous value. The file uploader, checkbox,
  combobox, OTP input, radio item, select and timeline card now
  take their borders, captions, accents and elevation from the host's theme
  instead of the webdevelop palette: near-black captions become
  `--muted-foreground`, the grey control border becomes `--input`, the warning
  red becomes `--destructive`, and the accent blue becomes `--primary`. The
  radio indicator carried a raw `red` and now follows `--primary` as well. This
  is the intent of the change — the package follows the host's theme rather than
  imposing ours — but it is a visible difference for every consumer, not only
  for hosts that adopt the `./styles` export.
- The host role variables those chains prefer (`--color-text-strong`,
  `--color-text-meta`, `--color-text-disabled`, `--color-border-strong`,
  `--color-accent-strong`, `--shadow-control`, `--shadow-dialog`) are optional.
  A host that defines none gets the contract terminal named above; a host that
  defines them keeps full control of the value.
- The four component elevations — the combobox, select and filter dropdown
  surfaces, and the completed timeline card — read `--shadow-dialog` and
  `--shadow-control`, falling back to a shadow mixed from `--foreground` rather
  than a fixed ink. A host that sets neither those role variables nor
  `--foreground` now paints no shadow on those four surfaces, where a fixed one
  used to appear.
- `src/public-theme.css` is unchanged, and five of its eight hooks now resolve
  differently from the in-component fallbacks: `--ui-color-border` and
  `--ui-color-canvas` bind `--border` and `--background` where the fallbacks
  reach `--input` and `--muted`; `--ui-color-text-secondary` and
  `--ui-color-text-muted` bind `--muted-foreground` directly where the fallbacks
  prefer the host role variable first; and `--ui-color-text-inverse` binds
  `--background` where the timeline card's own text fallback reads
  `--primary-foreground`. A host that adopts the `./styles` export therefore
  paints the filled timeline card's labels with the canvas colour, which is not
  guaranteed to contrast with `--primary`. Reconciling the hook API is a
  separate step.
- VSelectContent and VComboboxContent now use the host-controlled shared portal
  layer, defaulting to `--ui-dialog-z-index: 1100`; select supports the more
  specific `--ui-select-popup-z-index` override.
- Caller `z-*` classes continue to replace the shared defaults through the
  public `cn` merge helper.

## 0.1.4 — neutral form validation candidate

- Added the domain-neutral `form-validation` subpath with per-form standard AJV,
  immutable schema composition, host preparation hooks, and SSR-safe scrolling.
- Kept investment policy, custom keywords, reference defaults, and schema
  projection helpers outside the public UI Kit API.
- Updated the release and consumer machinery to select UI Kit 0.1.4 alongside
  frozen UI Primitives and historical Invest Widgets 0.1.3 registry inputs.
  The curated widget source and release ownership moved to `torque-packages`;
  it is never repacked from this repository.

## 0.1.3 — prepared candidate

- pnpm consumers pin inter-package dependencies to the same reviewed archives.
- Versions 0.1.0 and 0.1.1 were not released: bridge installation and
  version-aware verification were corrected before this candidate.

- First independently consumable source-SFC package with explicit subpaths.
- Host-owned themes, navigation and state; no private runtime dependencies.
- Query observation supports isolated SSR state; checkbox groups emit detached values.
- Private compliance validation and wildcard exports are excluded.
