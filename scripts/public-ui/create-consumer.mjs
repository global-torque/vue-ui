import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const [artifactArgument, consumerArgument] = process.argv.slice(2);
assert(artifactArgument && consumerArgument, 'Usage: create-consumer.mjs <artifacts> <new consumer directory>');
const artifacts = path.resolve(artifactArgument);
const consumer = path.resolve(consumerArgument);
assert(!fs.existsSync(consumer), 'Consumer must be new and isolated.');
fs.cpSync('examples/developer-starter', consumer, { recursive: true, filter: (entry) => !/(^|\/)(node_modules|dist|vendor|\.ui-verification|playwright-report|test-results)(\/|$)/.test(entry) && !entry.endsWith('/.env') });
const lock = { status: 'reviewed artifact consumer', artifacts: [] };
for (const name of ['ui-primitives', 'ui-kit', 'invest-widgets']) {
  const file = `global-torque-${name}-0.1.0.tgz`;
  const proof = JSON.parse(fs.readFileSync(path.join(artifacts, `${file}.manifest.json`), 'utf8'));
  assert.equal(proof.artifact, file);
  lock.artifacts.push({ file, sha512: proof.sha512, url: `https://github.com/global-torque/vue-ui/releases/download/v0.1.0/${file}` });
}
fs.writeFileSync(path.join(consumer, 'ui-artifacts.lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
// A release candidate needs its own consumer lock, never the previous release's tarball identity.
for (const lockfile of ['package-lock.json', 'pnpm-lock.yaml']) fs.rmSync(path.join(consumer, lockfile), { force: true });
console.log(consumer);
