# Public package catalog

Verified npm versions as of 2026-09-10. Install only the packages your product
needs; application routes, identity/session policy, backend access, branding and
deployment remain owned by the consuming product.

| Package | Version | Use and compatibility |
| --- | --- | --- |
| [SDK](https://github.com/global-torque/sdk) | `@global-torque/sdk@0.2.0` | Framework-free service clients and explicit wallet integrations. Supply transport/configuration and supported backend access. |
| [UI Primitives](../packages/ui-primitives/README.md) | `@global-torque/ui-primitives@0.1.3` | Low-level Vue controls through explicit component subpaths. Requires the documented Vue/Reka UI peers and host theme; charts are excluded. |
| [UI Kit](../packages/ui-kit/README.md) | `@global-torque/ui-kit@0.1.4` | Generic Vue forms, filters, pagination, upload and URL-state compositions. Compile source with the documented consumer toolchain. |
| [Design Tokens](https://github.com/global-torque/design-tokens) | `@global-torque/design-tokens@0.2.1` | Neutral token source and generated styles/data. No runtime dependencies. |
| [Content Toolkit](https://github.com/global-torque/content-toolkit) | `@global-torque/content-toolkit@0.2.0` | Content records, normalization, trees and host-defined path/image policies. |
| [VitePress Toolkit](https://github.com/global-torque/vitepress-toolkit) | `@global-torque/vitepress-toolkit@0.2.0` | VitePress content/head/SEO/sitemap helpers. VitePress 1.6.4 consumers must apply and verify the documented root Vite 6.4.3 override. |
| [Markdown-it Wikilinks](https://github.com/global-torque/markdown-it-wikilinks) | `@global-torque/markdown-it-wikilinks@0.2.0` | Escaped wiki-link parsing with host-defined resolution; optional Node frontmatter resolver. |
| [Client Error Handling](https://github.com/global-torque/client-error-handling) | `@global-torque/client-error-handling@0.1.0` | Framework-free error normalization, sanitization and bounded reporting. Supply your own reporter. |
| [Admin Toolkit](https://github.com/global-torque/admin-toolkit) | `@global-torque/admin-toolkit@0.2.0` | Neutral HTML/Django contracts, styles and Alpine/htmx behavior. Follow its peer and server-rendering contracts. |

## Start a product

Follow the [developer starter](../examples/developer-starter/README.md) for a
framework-free SDK example and a Vue offer explorer. `npm ci` installs exact
registry versions; the explicit fixture demo runs without private source.
Provision supported backend access before switching to live mode. Secrets stay
on the server, while browser state and themes belong to the host application.

For a documentation site, start with the wiki-link package and add content or
VitePress helpers only where needed. The host owns content schemas, URLs and
VitePress configuration. A package's overrides do not propagate into a consumer;
commit the required override and lockfile in the host and build that site.

## Adoption and updates

Use declared package subpaths, never private source paths. Review each package's
README for exports, styles, peers and runtime requirements. Pin a verified
version and commit your lockfile; update through a PR that runs the consuming
product's types, build, behavior and applicable browser/SSR checks.

These are ordinary semantic versions, with no alpha/beta suffix. They remain
pre-1.0 APIs; review changelogs before minor updates. Fixture tests cover the example; verify live backend capabilities separately.
Broader private investment runtime/features and compatibility UI remain outside
this catalog.

## Historical widget release

The curated `@global-torque/invest-widgets@0.1.3` package remains an immutable
npm release for existing consumers and the developer starter. Its source tree
and public descriptor are retired from `vue-ui`; future investment widget
releases are owned by `torque-packages` and use that framework's API contract.
