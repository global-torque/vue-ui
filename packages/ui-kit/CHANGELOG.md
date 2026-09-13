# Changelog

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
