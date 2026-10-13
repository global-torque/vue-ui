# Public Vue UI 0.1.3 historical verification

The [immutable release](https://github.com/global-torque/vue-ui/releases/tag/v0.1.3)
contains three npm-format archives, SHA-512 sidecars and per-file manifests from
clean source `bc2539ef90c00ec0a6fe099eba15ee8485db8c2d`.
These archives are retained historical evidence; `invest-widgets` is no longer
an active source or release selection in `vue-ui`.
The [release workflow](https://github.com/global-torque/vue-ui/actions/runs/34383451263)
builds these archives once, verifies isolated consumers, and attests the same
bytes. At that time, they were GitHub candidates for external evaluation, not npm releases. The exact archives were subsequently published to npm; see the [0.1.3 release record](./releases/0.1.3.md).

- Source lint, types and 137 tests pass on Node 22.23.1 and 24.14.0.
- Both npm and pnpm install the same retained archives outside the source tree.
- All 372 installed package files match the archives; all 56 JavaScript exports
  compile for client and SSR, with the SSR bundle imported without browser globals.
- The historical consumer's four SDK/HTTP tests and Vue production build pass.
- Browser CI covers 104 desktop/mobile and light/dark states, including keyboard
  navigation, focus restoration, errors, retry and cancellation. Its 96 stable
  whole-page Axe scans report zero violations.
- Selected source and consumer dependency audits report zero vulnerabilities.

Package manifests deliberately exclude private brands, validation defaults,
provider runtimes and the chart dependency chain. No full-library accessibility
certification, protected investment workflow, or live sandbox integration is
claimed. The historical consumer labeled fictional data and required explicit
configuration for a separately provisioned HTTPS service.

The release process froze package tags before the corresponding consumer
lockfile was populated. It verified the retained SHA-512 values before npm or
pnpm installs. Keep these pins for reproducibility; do not replace published
archives or move release tags.

To independently verify each downloaded archive's build attestation:

```sh
gh attestation verify global-torque-ui-primitives-0.1.3.tgz \
  --repo global-torque/vue-ui \
  --signer-workflow global-torque/vue-ui/.github/workflows/release.yml \
  --source-ref refs/tags/v0.1.3 \
  --source-digest bc2539ef90c00ec0a6fe099eba15ee8485db8c2d \
  --deny-self-hosted-runners
```

Repeat for UI Kit and Invest Widgets. Failed earlier tags have no released
assets; adopt only the retained `0.1.3` files.
