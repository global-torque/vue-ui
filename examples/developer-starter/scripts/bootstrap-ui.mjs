import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const lock = JSON.parse(await fs.readFile(new URL('../ui-artifacts.lock.json', import.meta.url), 'utf8'));
const packageNames = ['ui-primitives', 'ui-kit', 'invest-widgets'];
const artifactFilePattern = /^global-torque-(ui-primitives|ui-kit|invest-widgets)-(\d+\.\d+\.\d+)\.tgz$/;
const sha512Pattern = /^[a-f0-9]{128}$/;
const localDirectory = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
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
  assert(packageNames.includes(shortName), `Unsupported artifact name: ${name}`);
  assert.equal(shortName, packageName, `Artifact name contradicts filename: ${name}`);
  return `@global-torque/${shortName}`;
}

function expectedIntegrity(sha512) {
  return `sha512-${Buffer.from(sha512, 'hex').toString('base64')}`;
}

function validateArtifact(artifact) {
  assert(artifact && typeof artifact === 'object' && !Array.isArray(artifact), 'Artifact entry must be an object.');
  const identity = parseArtifactFile(artifact.file);
  const name = normalizeArtifactName(artifact.name, identity.packageName);
  if (artifact.version !== undefined) assert.equal(artifact.version, identity.version, `Artifact version contradicts filename: ${artifact.file}`);
  assert.match(artifact.sha512, sha512Pattern, `Artifact SHA-512 must be lowercase hex: ${artifact.file}`);
  if (artifact.integrity !== undefined) assert.equal(artifact.integrity, expectedIntegrity(artifact.sha512), `Artifact integrity contradicts SHA-512: ${artifact.file}`);
  assert.equal(typeof artifact.url, 'string', `Artifact URL is required: ${artifact.file}`);
  const url = new URL(artifact.url);
  assert.equal(url.protocol, 'https:', `Artifact URL must use HTTPS: ${artifact.file}`);
  assert.equal(url.username, '', `Artifact URL must not contain credentials: ${artifact.file}`);
  assert.equal(url.password, '', `Artifact URL must not contain credentials: ${artifact.file}`);
  assert.equal(url.port, '', `Artifact URL must not contain a port: ${artifact.file}`);
  assert.equal(url.search, '', `Artifact URL must not contain a query: ${artifact.file}`);
  assert.equal(url.hash, '', `Artifact URL must not contain a fragment: ${artifact.file}`);

  const registryPath = `/@global-torque/${identity.packageName}/-/${identity.packageName}-${identity.version}.tgz`;
  const registry = url.hostname === 'registry.npmjs.org' && url.pathname === registryPath;
  const candidateTag = lock.selection === 'single-package'
    ? `${identity.packageName}-v${identity.version}`
    : `v${identity.version}`;
  const candidatePath = `/global-torque/vue-ui/releases/download/${candidateTag}/${artifact.file}`;
  const candidate = url.hostname === 'github.com' && url.pathname === candidatePath;
  assert(registry || candidate, `Artifact URL does not match its identity: ${artifact.file}`);

  const inferredSource = registry ? 'registry' : 'candidate';
  const source = artifact.source ?? inferredSource;
  assert(['registry', 'candidate'].includes(source), `Unsupported artifact source: ${artifact.file}`);
  assert.equal(source, inferredSource, `Artifact source contradicts URL: ${artifact.file}`);
  return { ...identity, name, source };
}

await fs.mkdir(path.join(root, 'vendor'), { recursive: true });
const lockByName = new Map();
assert(Array.isArray(lock.artifacts) && lock.artifacts.length > 0, 'Artifact lock must contain artifacts.');
for (const artifact of lock.artifacts) {
  const identity = validateArtifact(artifact);
  assert(!lockByName.has(identity.name), `Duplicate artifact identity: ${identity.name}`);
  lockByName.set(identity.name, { artifact, identity });
}
for (const packageName of packageNames) assert(lockByName.has(`@global-torque/${packageName}`), `Missing artifact identity: @global-torque/${packageName}`);

const localCandidates = [];
for (const { artifact, identity } of lockByName.values()) {
  const localArchive = localDirectory && path.join(localDirectory, artifact.file);
  let bytes;
  if (localArchive && identity.source === 'candidate') {
    // A supplied candidate directory is an explicit immutable input. Do not
    // silently replace a missing candidate with a network download.
    bytes = await fs.readFile(localArchive);
  } else if (localArchive) {
    try {
      // Legacy locks may omit source. A supplied registry archive is still a
      // local byte input, while its registry URL and dependency semantics are
      // validated and preserved above.
      bytes = await fs.readFile(localArchive);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  if (!bytes) {
    const response = await fetch(new URL(artifact.url));
    if (!response.ok) throw new Error(`Artifact download failed (${response.status}); use the reviewed candidate directory as an explicit argument.`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  const actualSha512 = crypto.createHash('sha512').update(bytes).digest('hex');
  assert.equal(actualSha512, artifact.sha512, `Integrity mismatch: ${artifact.file}`);
  await fs.writeFile(path.join(root, 'vendor', artifact.file), bytes);
  if (identity.source === 'candidate') localCandidates.push({ artifact, identity });
  console.log(`Verified ${artifact.file}`);
}

if (localCandidates.length) {
  const packageJsonPath = path.join(root, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
  assert(packageJson.dependencies && typeof packageJson.dependencies === 'object', 'Consumer dependencies are required.');
  for (const { artifact, identity } of localCandidates) {
    assert(Object.hasOwn(packageJson.dependencies, identity.name), `Candidate dependency is not declared: ${identity.name}`);
    packageJson.dependencies[identity.name] = `file:vendor/${artifact.file}`;
  }
  await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}
