# Changelog

## Unreleased

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
