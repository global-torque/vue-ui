# Global Torque Vue UI

Three source-SFC packages for independent Vue products: UI Primitives, generic
UI Kit compositions, and controlled investment presentation widgets. All use
ordinary semantic versions and host-owned themes/state. No private backend or
platform checkout is needed for the demonstrated fixture flow.

The [0.1.3 GitHub release](https://github.com/global-torque/vue-ui/releases/tag/v0.1.3)
contains immutable, attested package archives. Start with the developer starter
on `master`, which pins those archives and includes its npm lockfile. These are
GitHub candidates; the three UI packages have not been published to npm.

See packages/*/README.md for API and styling contracts, and
[the developer starter](examples/developer-starter/README.md) for setup, a
framework-free SDK example and the Vue offer explorer. Live verification needs
a separately provisioned sandbox; fixture evidence is not live-service proof.

Maintainers: Global Torque frontend team. MIT; see notices in each package.
Contribution checks: `pnpm install --frozen-lockfile` then `pnpm check`.
Packages are source-SFC distributions compiled by the consuming Vue toolchain.
Release archives are built once from clean source by the release workflow.
