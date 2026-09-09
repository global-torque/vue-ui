# Global Torque developer starter

A standalone, read-only offer explorer using the published `@global-torque/sdk`
0.2.0 and the public UI candidate artifacts. Includes a framework-free SDK
example and a Vue application. It does not import private platform runtime,
repositories, routes, stores or brand assets.

## Quick start

Use Node 24.14+ and npm, or pnpm 10.34.5. From this directory:

```sh
node scripts/bootstrap-ui.mjs
npm ci
npm run check
npm run demo
```

Open http://127.0.0.1:4300. The demo command explicitly selects fixtures; the UI
labels them as fictional data. Preview success, empty, loading, service-error
and rejected-access states. View an offer, return to the list, select a sample
profile and switch themes. Profile selection is local presentation state, not
an authentication or permission change.

The UI packages are installed from exact retained archives pinned by SHA-512 in
`ui-artifacts.lock.json`. Bootstrap rejects altered bytes. If using downloaded
release assets, pass their directory explicitly:

```sh
node scripts/bootstrap-ui.mjs /absolute/path/to/release
npm ci
```

For pnpm, bootstrap first, then `pnpm install` and `pnpm run check`. The supplied
npm lock is the canonical starter lock; retain your generated pnpm lock when
adopting the example. UI source files are editable TypeScript/Vue components,
compiled by Vite and Tailwind with the host-owned theme in `src/theme.css`.

## Framework-free SDK example

```sh
npm run offers:demo
```

`server/offers-example.mjs` calls the published SDK's validated `listOffers`
and `getOffer` APIs without Vue or private packages. Fixture mode injects an
explicit Fetch adapter; it is not live integration evidence.

## Live sandbox setup

Copy `.env.example` to `.env` and obtain a provisioned sandbox from the API
owner. Set all required values:

- `STARTER_MODE=live`.
- `OFFERS_API_URL`: exact HTTPS service base URL, without credentials/query.
- `OFFERS_APPLICATION_AUTH=none|api-key`; supply `OFFERS_API_KEY` for api-key.
- `OFFERS_USER_AUTH=none|bearer`; supply `OFFERS_BEARER_TOKEN` for bearer.
- Optional `STARTER_PORT` (default 4300).

```sh
npm run offers:live
npm run start
```

The service must support `GET /public/offer?limit=100` and
`GET /public/offer/{slug}` under the configured base URL. SDK 0.2.0 validators
require list/detail identifiers and validate the current public wire contract.
List/detail capability does not imply support for subscriptions, eligibility,
wallet operations or payments; add those only with their separate contracts.

Ask the service owner to confirm sandbox origin, access provisioning, key scope,
user authentication, supported schema revision, rate limits and browser-origin
requirements. The current server example makes authenticated SDK calls from
Node: browser requests remain same-origin to `/api/offers`, so application keys
and bearer tokens never enter the client bundle. This example does not implement
multi-user sessions; integrate your own server-side identity/session management
before using protected per-user resources. Never place credentials in `VITE_*`
variables. SDK redirects remain disabled for credentialed requests.

Missing or invalid live configuration fails at startup. Service failures stay
visible; live mode never falls back to fixtures or another backend. No external
sandbox has been provisioned for this example yet: live verification remains
pending until the owner supplies the supported endpoint/access.

## Ownership and verification

`server/offers.mjs` owns SDK configuration, fixture selection and presentation
mapping. `server/index.mjs` exposes only bounded read routes and serves the
built application; there is no arbitrary URL proxy. `src/useOffers.ts` owns
loading/error/retry/cancellation; the View renders state and emits commands.
Each mounted app owns its profile and offer state. Widgets have no global
provider fallback. The host supplies all themes, labels, navigation and data.

`npm run test` checks configuration, SDK list/detail validation, HTTP states,
path restrictions and credential redaction. `npm run test:browser` runs the browser checks against a running demo server
after `npx playwright install chromium`. `npm run build` checks types and
builds the real Vue application. `scripts/verify-ui.mjs` verifies every installed
package file against the archive and builds/imports all UI exports for client
and SSR; charts are excluded from the initial public primitive contract pending an
upstream dependency fix. Browser evidence covers desktop/mobile, themes,
loading/empty/error/retry, keyboard and profile isolation; see the release report.

This is a development starter, not a deployment or compliance template.
Global Torque frontend maintainers own the example. MIT; see LICENSE.
