# Global Torque Vue UI

Two active compiled Vue packages for independent Vue products: UI Primitives and
generic UI Kit compositions. Both use ordinary semantic versions and host-owned
themes/state. No private backend or platform checkout is needed for the
demonstrated fixture flow.

The curated `@global-torque/invest-widgets@0.1.3` release is an immutable
historical registry dependency used by the developer starter. Its source and
release descriptor are retired from this repository; new investment widgets
are owned and released by `torque-packages` under the framework contract.

The [0.1.3 GitHub release](https://github.com/global-torque/vue-ui/releases/tag/v0.1.3)
contains immutable, attested archives for the historical three-package set.
Start with the developer starter on `master`, which installs the published npm
versions with an integrity lockfile. The active UI packages remain available on
npm, while the curated widget pin is retained for legacy consumers. See the
[release verification](docs/releases/0.1.3.md).

See the [package catalog](docs/packages.md), packages/*/README.md for API and styling contracts, and
[the developer starter](examples/developer-starter/README.md) for setup, a
framework-free SDK example and the Vue offer explorer. Live verification needs
a separately provisioned sandbox; fixture evidence is not live-service proof.

Maintainers: Global Torque frontend team. MIT; see notices in each package.
Contribution checks: `pnpm install --frozen-lockfile` then `pnpm check`.
Packages ship compiled JavaScript, declarations and styles in `dist/`.
`pnpm check` builds both packages before validating release archives. Release
archives are built once from clean source by the release workflow.

## UI Kit releases

UI Kit releases use an exact `vX.Y.Z` tag matching the version in
`packages/ui-kit/public-package.json`; UI Primitives uses
`ui-primitives-vX.Y.Z` matching its own version. Each tag releases only the
selected package's compiled archive. npm publication is a separate maintainer
operation: publish Primitives before installing a Kit version that depends on
its new version. Existing `v0.1.3` and `ui-kit-v*` records must not be moved
or rebuilt.

Before tagging, merge the version, changelog, documentation and coupled test
updates and run `pnpm check` plus a clean selected-package pack. Confirm that
immutable releases are enabled, then tag that exact verified commit. Recover
from a failed release by preparing and verifying a new patch version; never
move a published tag or replace its assets.
