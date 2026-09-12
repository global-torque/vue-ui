import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolveHostSingletons, SINGLETON_DEPENDENCIES } from './resolve-singletons.mjs';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const lock = JSON.parse(await fs.readFile(path.join(root, 'ui-artifacts.lock.json'), 'utf8'));
const names = ['ui-primitives', 'ui-kit', 'invest-widgets'];
const artifactFilePattern = /^global-torque-(ui-primitives|ui-kit|invest-widgets)-(\d+\.\d+\.\d+)\.tgz$/;
const sha512Pattern = /^[a-f0-9]{128}$/;
assert(lock.selection === undefined || ['single-package', 'all-packages'].includes(lock.selection), `Unsupported artifact selection: ${lock.selection}`);

function parseArtifactFile(file) {
  assert.equal(typeof file, 'string', 'Artifact file must be a string.');
  assert.equal(path.basename(file), file, `Artifact path must be a filename: ${file}`);
  const match = file.match(artifactFilePattern);
  assert(match, `Unsupported artifact filename: ${file}`);
  return { packageName: match[1], version: match[2] };
}

function normalizeArtifactName(name, packageName) {
  if (name === undefined) return `@global-torque/${packageName}`;
  assert.equal(typeof name, 'string', `Unsupported artifact name for ${packageName}`);
  const shortName = name.startsWith('@global-torque/') ? name.slice('@global-torque/'.length) : name;
  assert(names.includes(shortName), `Unsupported artifact name: ${name}`);
  assert.equal(shortName, packageName, `Artifact name contradicts filename: ${name}`);
  return `@global-torque/${shortName}`;
}

function expectedIntegrity(sha512) {
  return `sha512-${Buffer.from(sha512, 'hex').toString('base64')}`;
}

const lockByName = new Map();
assert(Array.isArray(lock.artifacts) && lock.artifacts.length > 0, 'Artifact lock must contain artifacts.');
for (const artifact of lock.artifacts) {
  assert(artifact && typeof artifact === 'object' && !Array.isArray(artifact), 'Artifact entry must be an object.');
  const identity = parseArtifactFile(artifact.file);
  const name = normalizeArtifactName(artifact.name, identity.packageName);
  if (artifact.version !== undefined) assert.equal(artifact.version, identity.version, `Artifact version contradicts filename: ${artifact.file}`);
  assert.match(artifact.sha512, sha512Pattern, `Artifact SHA-512 must be lowercase hex: ${artifact.file}`);
  if (artifact.integrity !== undefined) assert.equal(artifact.integrity, expectedIntegrity(artifact.sha512), `Artifact integrity contradicts SHA-512: ${artifact.file}`);
  assert(!lockByName.has(name), `Duplicate artifact identity: ${name}`);
  lockByName.set(name, { artifact, identity, name });
}
const results = [];
const imports = [];
const selectedNeutralFixture = lockByName.get('@global-torque/ui-kit')?.identity.version === '0.1.4';
const installedPackages = [];
for (const name of names) {
  const installed = path.join(root, 'node_modules/@global-torque', name);
  const real = await fs.realpath(installed);
  assert(real.startsWith(`${root}${path.sep}`), `Package resolved outside clean consumer: ${name}`);
  const manifest = JSON.parse(await fs.readFile(path.join(installed, 'package.json'), 'utf8'));
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  for (const dependency of SINGLETON_DEPENDENCIES) {
    assert(manifest.peerDependencies?.[dependency], `${manifest.name} must keep ${dependency} as a host singleton peer`);
  }
  installedPackages.push({ name: manifest.name, apparentPath: installed });
}
await resolveHostSingletons({ root, packages: installedPackages });
for (const name of names) {
  const installed = path.join(root, 'node_modules/@global-torque', name);
  const real = await fs.realpath(installed);
  const manifest = JSON.parse(await fs.readFile(path.join(installed, 'package.json'), 'utf8'));
  const recordedEntry = lockByName.get(manifest.name);
  const recorded = recordedEntry?.artifact;
  assert(recorded, `Missing artifact lock entry: ${manifest.name}`);
  assert.equal(recordedEntry.identity.packageName, name);
  assert.equal(recordedEntry.identity.version, manifest.version);
  assert.equal(recorded.file, `global-torque-${name}-${manifest.version}.tgz`);
  if (recorded.source === 'candidate') assert(['single-package', 'all-packages'].includes(lock.selection));
  if (lock.selection === 'single-package' && recorded.source === 'candidate') {
    assert.equal(lock.selected?.name, manifest.name);
    assert.equal(lock.selected?.sha512, recorded.sha512);
    assert.equal(lock.selected?.version, manifest.version);
    assert.equal(lock.selected?.sourceCommit, recorded.sourceCommit);
    assert.equal(lock.selected?.sourceDirty, recorded.sourceDirty);
    assert.equal(lock.selected?.file, recorded.file);
    assert.equal(lock.selected?.integrity, recorded.integrity);
  }
  const archive = path.join(root, 'vendor', `global-torque-${name}-${manifest.version}.tgz`);
  const archiveBytes = await fs.readFile(archive);
  assert.equal(
    crypto.createHash('sha512').update(archiveBytes).digest('hex'),
    recorded.sha512,
    `Archive digest mismatch: ${manifest.name}`,
  );
  const members = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n').filter((entry) => !entry.endsWith('/'));
  for (const entry of members) {
    assert(entry.startsWith('package/') && !entry.split('/').includes('..'));
    const bytes = execFileSync('tar', ['-xOf', archive, entry], { maxBuffer: 8 * 1024 * 1024 });
    const actual = await fs.readFile(path.join(installed, entry.slice(8)));
    assert.equal(crypto.createHash('sha512').update(actual).digest('hex'), crypto.createHash('sha512').update(bytes).digest('hex'), `Installed bytes mismatch: ${entry}`);
  }
  let count = 0;
  for (const [key, target] of Object.entries(manifest.exports)) {
    const specifier = `${manifest.name}${key === '.' ? '' : key.slice(1)}`;
    assert(await fs.stat(fileURLToPath(import.meta.resolve(specifier))));
    if (!/\.(css|scss)$/.test(target)) { imports.push(`import * as entry${imports.length} from ${JSON.stringify(specifier)};`); count++; }
  }
  results.push({ name: manifest.name, version: manifest.version, files: members.length, imports: count, installed: real });
}
const temporary = path.join(root, '.ui-verification');
await fs.mkdir(temporary, { recursive: true });
const entry = path.join(temporary, 'exports.ts');
const fixtureImport = selectedNeutralFixture
  ? "import * as neutralFormValidation from '@global-torque/ui-kit/form-validation'; import { runNeutralValidationFixture } from '../fixtures/neutral-validation';"
  : '';
const fixtureExport = selectedNeutralFixture
  ? 'export const neutralValidation = runNeutralValidationFixture(); export const neutralValidationExports = Object.keys(neutralFormValidation).sort();'
  : '';
await fs.writeFile(entry, `${imports.join('\n')}\n${fixtureImport}\nexport const entries = [${imports.map((_, i) => `entry${i}`).join(',')}];\n${fixtureExport}\n`);
for (const ssr of [false, true]) {
  await build({ configFile: false, root, plugins: [vue()], ssr: { noExternal: true }, build: { ssr, outDir: path.join(temporary, ssr ? 'server' : 'client'), emptyOutDir: true, lib: { entry, formats: ['es'], fileName: 'exports' }, rollupOptions: { external: (id) => /^(vue|reka-ui)(\/|$)/.test(id) || id.startsWith('node:') } } });
}
assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const module = await import(pathToFileURL(path.join(temporary, 'server/exports.js')).href);
assert.equal(module.entries.length, imports.length);
if (selectedNeutralFixture) {
  assert.deepEqual(module.neutralValidation, { valid: false, error: 'Should have at least 2 characters' });
  assert.deepEqual(module.neutralValidationExports, [
    'scrollToError',
    'useForm',
    'useFormErrors',
    'useFormValidation',
  ]);
}
await fs.writeFile(path.join(temporary, 'proof.json'), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify({ packages: results, ssr: 'no browser globals', exports: imports.length }));
