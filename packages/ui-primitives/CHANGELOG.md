# Changelog

## Unreleased

- Publish the shadcn contract value file as `styles/contract`. It binds every
  contract name to a `--gt-*` design token and holds no brand literal, so a
  host recolours the components by overriding the `--brand-*` seeds instead of
  declaring the roles itself. Declaring them stays supported.

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
