import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const argumentsList = process.argv.slice(2);
const packageNames = ['ui-primitives', 'ui-kit', 'invest-widgets'];
const selectedIndex = argumentsList.findIndex((argument) => argument === '--package' || argument.startsWith('--package='));
const hasSelection = selectedIndex !== -1;
const selectedPackage = selectedIndex === -1
  ? undefined
  : argumentsList[selectedIndex] === '--package'
    ? argumentsList[selectedIndex + 1]
    : argumentsList[selectedIndex].slice('--package='.length);
assert(!hasSelection || packageNames.includes(selectedPackage), `Unknown package selection: ${selectedPackage}`);
const positional = argumentsList.filter((argument, index) => (
  !argument.startsWith('-')
  && !(selectedIndex !== -1 && index === selectedIndex + 1 && argumentsList[selectedIndex] === '--package')
));
const [artifactArgument, consumerArgument] = positional;
assert(artifactArgument && consumerArgument, 'Usage: create-consumer.mjs <artifacts> <new consumer directory>');
const artifacts = path.resolve(artifactArgument);
const consumer = path.resolve(consumerArgument);
assert(!fs.existsSync(consumer), 'Consumer must be new and isolated.');
fs.cpSync('examples/developer-starter', consumer, { recursive: true, filter: (entry) => !/(^|\/)(node_modules|dist|vendor|\.ui-verification|playwright-report|test-results|\.browser-evidence)(\/|$)/.test(entry) && !entry.endsWith('/.env') });
const registryArtifacts = {
  'ui-primitives': {
    version: '0.1.3',
    integrity: 'sha512-VGUFTGfn7vn7xIUPntI1M2jL0B95ghQ0YT1d3g1/JnH40ioFAcyeN8nHolbgsgkmkL/Bhh/PsvHpRQTygYmbdQ==',
  },
  'invest-widgets': {
    version: '0.1.3',
    integrity: 'sha512-wrwv1Tm/ghT5CouhicGivDKtPNf+eLs+NJeI8n6q/J+C9nrTthEUsAc1ObbTIF3YHDcGxZ6mN1u3Ekg71kbLag==',
  },
};
const digestHex = (integrity) => Buffer.from(integrity.slice('sha512-'.length), 'base64').toString('hex');
const lock = {
  status: 'reviewed artifact consumer',
  selection: selectedPackage ? 'single-package' : 'all-packages',
  selected: undefined,
  artifacts: [],
};
const selectedReceipt = selectedPackage
  ? JSON.parse(fs.readFileSync(path.join(artifacts, 'selected-release.json'), 'utf8'))
  : undefined;
if (selectedPackage) {
  assert.equal(selectedReceipt.schemaVersion, 1, 'Selected release receipt schema is unsupported.');
  assert.equal(selectedReceipt.selection, 'single-package');
  assert.equal(selectedReceipt.package, `@global-torque/${selectedPackage}`);
}
for (const name of packageNames) {
  const descriptor = JSON.parse(fs.readFileSync(`packages/${name}/public-package.json`, 'utf8'));
  if (selectedPackage === name || !selectedPackage) {
    const file = `global-torque-${name}-${descriptor.manifest.version}.tgz`;
    const proof = JSON.parse(fs.readFileSync(path.join(artifacts, `${file}.manifest.json`), 'utf8'));
    assert.equal(proof.schemaVersion, 1);
    assert.equal(proof.artifact, file);
    assert.equal(proof.package, descriptor.manifest.name);
    if (selectedPackage) {
      assert.equal(selectedReceipt.version, proof.version);
      assert.equal(selectedReceipt.sourceCommit, proof.sourceCommit);
      assert.equal(selectedReceipt.sourceDirty, proof.sourceDirty);
      assert.equal(selectedReceipt.artifact, proof.artifact);
      assert.equal(selectedReceipt.sha512, proof.sha512);
      assert.equal(selectedReceipt.integrity, proof.integrity);
      lock.selected = {
        name: descriptor.manifest.name,
        version: proof.version,
        sourceCommit: proof.sourceCommit,
        sourceDirty: proof.sourceDirty,
        file,
        sha512: proof.sha512,
        integrity: proof.integrity,
      };
    }
    lock.artifacts.push({
      name: descriptor.manifest.name,
      version: proof.version,
      source: 'candidate',
      file,
      sha512: proof.sha512,
      integrity: proof.integrity,
      ...(selectedPackage ? { sourceCommit: proof.sourceCommit, sourceDirty: proof.sourceDirty } : {}),
      url: `https://github.com/global-torque/vue-ui/releases/download/${selectedPackage ? `${name}-v${proof.version}` : `v${proof.version}`}/${file}`,
    });
    continue;
  }
  const registry = registryArtifacts[name];
  assert(registry, `No frozen registry identity for unchanged package ${name}`);
  assert.equal(descriptor.manifest.version, registry.version);
  const file = `global-torque-${name}-${registry.version}.tgz`;
  lock.artifacts.push({
    name: descriptor.manifest.name,
    version: registry.version,
    source: 'registry',
    file,
    sha512: digestHex(registry.integrity),
    integrity: registry.integrity,
    url: `https://registry.npmjs.org/@global-torque/${name}/-/${name}-${registry.version}.tgz`,
  });
}
const packageJsonPath = path.join(consumer, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
for (const artifact of lock.artifacts.filter(({ source }) => source === 'candidate')) {
  assert(Object.hasOwn(packageJson.dependencies, artifact.name), `Candidate dependency is not declared: ${artifact.name}`);
  packageJson.dependencies[artifact.name] = artifact.version;
}
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
fs.writeFileSync(path.join(consumer, 'ui-artifacts.lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
// A release candidate needs its own consumer lock, never the previous release's tarball identity.
for (const lockfile of ['package-lock.json', 'pnpm-lock.yaml']) fs.rmSync(path.join(consumer, lockfile), { force: true });
console.log(consumer);
