import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const releaseWorkflowPath = path.join(root, '.github/workflows/release.yml');
const provenanceWorkflowPath = path.join(root, '.github/workflows/npm-provenance.yml');

function workflowRunBody(workflow, stepName) {
  const marker = `      - name: ${stepName}`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, `Workflow step is missing: ${stepName}`);
  const runStart = workflow.indexOf('\n        run: |\n', start);
  assert.notEqual(runStart, -1, `Workflow step has no shell body: ${stepName}`);
  const bodyLines = [];
  const lines = workflow.slice(runStart + '\n        run: |\n'.length).split('\n');
  for (const line of lines) {
    if (!line.startsWith('          ')) break;
    bodyLines.push(line.slice(10));
  }
  return bodyLines.join('\n');
}

function runReleaseRetention(body, tag) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vue-ui-workflow-'));
  const bin = path.join(directory, 'bin');
  const release = path.join(directory, 'release');
  const log = path.join(directory, 'gh.log');
  fs.mkdirSync(bin);
  fs.mkdirSync(release);
  for (const file of ['global-torque-ui-kit-0.1.4.tgz', 'global-torque-ui-kit-0.1.4.tgz.manifest.json', 'global-torque-ui-kit-0.1.4.tgz.sha512']) fs.writeFileSync(path.join(release, file), 'fixture');
  const gh = path.join(bin, 'gh');
  fs.writeFileSync(gh, '#!/bin/sh\nprintf \'%s\\n\' "$@" > "$GH_STUB_LOG"\n');
  fs.chmodSync(gh, 0o755);
  try {
    execFileSync('bash', ['-euo', 'pipefail', '-c', body], {
      cwd: directory,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GH_STUB_LOG: log, GITHUB_REF_NAME: tag },
      stdio: 'pipe',
    });
    return fs.readFileSync(log, 'utf8').trim().split('\n');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function provenanceFixture({ releaseState, mutateReceipt, attestation = 'success', tag = 'ui-kit-v0.1.4', packageName = 'ui-kit' } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vue-ui-provenance-'));
  const fixture = path.join(directory, 'fixture');
  const work = path.join(directory, 'work');
  const bin = path.join(directory, 'bin');
  const log = path.join(directory, 'gh.log');
  const output = path.join(directory, 'github-output');
  const archive = 'global-torque-ui-kit-0.1.4.tgz';
  const sourceCommit = 'a'.repeat(40);
  fs.mkdirSync(path.join(fixture, 'package'), { recursive: true });
  fs.mkdirSync(work);
  fs.mkdirSync(bin);
  fs.writeFileSync(output, '');
  fs.writeFileSync(path.join(fixture, 'package/package.json'), `${JSON.stringify({ name: '@global-torque/ui-kit', version: '0.1.4' })}\n`);
  execFileSync('tar', ['-czf', path.join(fixture, archive), '-C', fixture, 'package/package.json']);
  const archiveBytes = fs.readFileSync(path.join(fixture, archive));
  const sha512 = crypto.createHash('sha512').update(archiveBytes).digest('hex');
  const integrity = `sha512-${Buffer.from(sha512, 'hex').toString('base64')}`;
  const sidecar = {
    schemaVersion: 1,
    package: '@global-torque/ui-kit',
    version: '0.1.4',
    sourceCommit,
    sourceDirty: false,
    artifact: archive,
    sha512,
    integrity,
    files: { 'package.json': 'fixture' },
  };
  const receipt = {
    schemaVersion: 1,
    selection: 'single-package',
    package: '@global-torque/ui-kit',
    version: '0.1.4',
    sourceCommit,
    sourceDirty: false,
    artifact: archive,
    sha512,
    integrity,
  };
  mutateReceipt?.(receipt);
  fs.writeFileSync(path.join(fixture, `${archive}.manifest.json`), `${JSON.stringify(sidecar, null, 2)}\n`);
  fs.writeFileSync(path.join(fixture, `${archive}.sha512`), `${sha512}  ${archive}\n`);
  fs.writeFileSync(path.join(fixture, 'selected-release.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  const gh = path.join(bin, 'gh');
  fs.writeFileSync(gh, `#!/bin/sh
set -eu
printf '%s\\n' "$*" >> "$GH_STUB_LOG"
case "\${1:-} \${2:-}" in
  "release view")
    printf '%s\\n' "$GH_RELEASE_JSON"
    ;;
  "release download")
    shift 2
    destination=.
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --dir) destination="$2"; shift 2 ;;
        --pattern) cp "$GH_FIXTURE_DIR/$2" "$destination/$2"; shift 2 ;;
        --repo) shift 2 ;;
        *) shift ;;
      esac
    done
    ;;
  "attestation verify")
    if [ "$GH_ATTESTATION_MODE" = fail ]; then exit 17; fi
    if [ "$GH_ATTESTATION_MODE" != empty ]; then printf '%s\\n' '{"verificationResult":{"verified":true}}'; fi
    ;;
  *) exit 19 ;;
esac
`);
  fs.chmodSync(gh, 0o755);
  const state = releaseState ?? { isDraft: false, isImmutable: true, isPrerelease: false, tagName: 'ui-kit-v0.1.4' };
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    GH_STUB_LOG: log,
    GH_FIXTURE_DIR: fixture,
    GH_RELEASE_JSON: JSON.stringify(state),
    GH_ATTESTATION_MODE: attestation,
    GITHUB_REPOSITORY: 'global-torque/vue-ui',
    RELEASE_TAG: tag,
    PACKAGE: packageName,
    GITHUB_OUTPUT: output,
  };
  return { directory, fixture, work, log, output, env, archive, sha512, integrity, sourceCommit };
}

function runProvenance(body, options = {}) {
  const fixture = provenanceFixture(options);
  let error;
  try {
    execFileSync('bash', ['-euo', 'pipefail', '-c', body], { cwd: fixture.work, env: fixture.env, stdio: 'pipe' });
  } catch (cause) {
    error = cause;
  }
  const log = fs.existsSync(fixture.log) ? fs.readFileSync(fixture.log, 'utf8').trim().split('\n').filter(Boolean) : [];
  const output = fs.readFileSync(fixture.output, 'utf8').trim().split('\n').filter(Boolean);
  return { ...fixture, error, log, output };
}

function disposeProvenance(result) {
  fs.rmSync(result.directory, { recursive: true, force: true });
}

test('selected UI Kit workflow retention is draft-only while legacy v tags remain ordinary', () => {
  const workflow = fs.readFileSync(releaseWorkflowPath, 'utf8');
  const body = workflowRunBody(workflow, 'Retain candidate or promote legacy release');
  const selectedArgs = runReleaseRetention(body, 'ui-kit-v0.1.4');
  assert.equal(selectedArgs[0], 'release');
  assert.equal(selectedArgs[1], 'create');
  assert(selectedArgs.includes('--draft'), 'selected release must be retained as a draft');
  const legacyArgs = runReleaseRetention(body, 'v0.1.3');
  assert.equal(legacyArgs[0], 'release');
  assert.equal(legacyArgs[1], 'create');
  assert(!legacyArgs.includes('--draft'), 'legacy all-package release keeps ordinary promotion');
});

test('selected tag verification rejects a version or package descriptor mismatch', () => {
  const workflow = fs.readFileSync(releaseWorkflowPath, 'utf8');
  const body = workflowRunBody(workflow, 'Verify tag and pack once');
  const tagVerification = body.split('\nif [[ "${GITHUB_REF_NAME}" == ui-kit-v* ]]')[0];
  const pass = execFileSync('bash', ['-euo', 'pipefail', '-c', tagVerification], {
    cwd: root,
    env: { ...process.env, GITHUB_REF_NAME: 'ui-kit-v0.1.4' },
    stdio: 'pipe',
  });
  assert.equal(pass.toString(), '');
  assert.throws(() => execFileSync('bash', ['-euo', 'pipefail', '-c', tagVerification], {
    cwd: root,
    env: { ...process.env, GITHUB_REF_NAME: 'ui-kit-v0.1.3' },
    stdio: 'pipe',
  }));
});

test('npm provenance requires an immutable promoted release and exact selected receipt fields', () => {
  const release = fs.readFileSync(releaseWorkflowPath, 'utf8');
  const provenance = fs.readFileSync(provenanceWorkflowPath, 'utf8');
  assert.match(release, /node scripts\/public-ui\/pack\.mjs release --package ui-kit/);
  assert.match(release, /torque-ui-kit-candidate-%s/);
  assert.match(release, /name: \$\{\{ steps\.candidate-artifact\.outputs\.name \}\}/);
  assert.match(release, /gh release create "\$\{release_args\[@\]\}" --draft/);
  assert.match(provenance, /\.isDraft == false and \.isImmutable == true and \.isPrerelease == false/);
  assert.match(provenance, /\.schemaVersion == 1 and \.sourceDirty == false/);
  assert.match(provenance, /\.selection == "single-package"/);
  assert.match(provenance, /\.sourceCommit == \$source/);
  assert.match(provenance, /\.sha512 == \$sha512 and \.integrity == \$integrity/);
});

test('npm provenance extracted shell body accepts an exact promoted candidate and emits subjects', () => {
  const workflow = fs.readFileSync(provenanceWorkflowPath, 'utf8');
  const body = workflowRunBody(workflow, 'Verify retained archive and original provenance');
  const result = runProvenance(body);
  try {
    assert.ifError(result.error);
    assert.equal(result.log.filter((entry) => entry.startsWith('attestation verify ')).length, 1);
    assert(result.log.findIndex((entry) => entry.startsWith('release view ')) < result.log.findIndex((entry) => entry.startsWith('attestation verify ')));
    assert(result.log.findIndex((entry) => entry.startsWith('release download ')) < result.log.findIndex((entry) => entry.startsWith('attestation verify ')));
    assert.deepEqual(result.output, [
      `digest=sha512:${result.sha512}`,
      'name=pkg:npm/%40global-torque/ui-kit@0.1.4',
    ]);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(result.work, 'original-provenance.json'), 'utf8')), { verificationResult: { verified: true } });
  } finally {
    disposeProvenance(result);
  }
});

test('npm provenance rejects draft, mutable, prerelease and invalid tags before attestation', () => {
  const workflow = fs.readFileSync(provenanceWorkflowPath, 'utf8');
  const body = workflowRunBody(workflow, 'Verify retained archive and original provenance');
  const states = [
    { isDraft: true, isImmutable: true, isPrerelease: false, tagName: 'ui-kit-v0.1.4' },
    { isDraft: false, isImmutable: false, isPrerelease: false, tagName: 'ui-kit-v0.1.4' },
    { isDraft: false, isImmutable: true, isPrerelease: true, tagName: 'ui-kit-v0.1.4' },
  ];
  for (const releaseState of states) {
    const result = runProvenance(body, { releaseState });
    try {
      assert(result.error, `release state should be rejected: ${JSON.stringify(releaseState)}`);
      assert.equal(result.log.filter((entry) => entry.startsWith('attestation verify ')).length, 0);
      assert.deepEqual(result.output, []);
    } finally {
      disposeProvenance(result);
    }
  }
  const result = runProvenance(body, { tag: 'ui-kit-v0.1' });
  try {
    assert(result.error, 'invalid tag should be rejected');
    assert.deepEqual(result.log, []);
    assert.deepEqual(result.output, []);
  } finally {
    disposeProvenance(result);
  }
});

test('npm provenance rejects each selected receipt identity field before attestation', () => {
  const workflow = fs.readFileSync(provenanceWorkflowPath, 'utf8');
  const body = workflowRunBody(workflow, 'Verify retained archive and original provenance');
  const mutations = [
    ['schemaVersion', (receipt) => { receipt.schemaVersion = 2; }],
    ['selection', (receipt) => { receipt.selection = 'all-packages'; }],
    ['artifact', (receipt) => { receipt.artifact = 'global-torque-ui-kit-0.1.3.tgz'; }],
    ['sourceCommit', (receipt) => { receipt.sourceCommit = 'b'.repeat(40); }],
    ['sourceDirty', (receipt) => { receipt.sourceDirty = true; }],
    ['sha512', (receipt) => { receipt.sha512 = '0'.repeat(128); }],
    ['integrity', (receipt) => { receipt.integrity = 'sha512-d3Jvbmc='; }],
  ];
  for (const [field, mutateReceipt] of mutations) {
    const result = runProvenance(body, { mutateReceipt });
    try {
      assert(result.error, `selected receipt field should be rejected: ${field}`);
      assert.equal(result.log.filter((entry) => entry.startsWith('attestation verify ')).length, 0, field);
      assert.deepEqual(result.output, [], field);
    } finally {
      disposeProvenance(result);
    }
  }
});

test('npm provenance rejects unsuccessful or empty attestation subjects', () => {
  const workflow = fs.readFileSync(provenanceWorkflowPath, 'utf8');
  const body = workflowRunBody(workflow, 'Verify retained archive and original provenance');
  for (const attestation of ['fail', 'empty']) {
    const result = runProvenance(body, { attestation });
    try {
      assert(result.error, `attestation mode should be rejected: ${attestation}`);
      assert.equal(result.log.filter((entry) => entry.startsWith('attestation verify ')).length, 1);
      assert.deepEqual(result.output, []);
    } finally {
      disposeProvenance(result);
    }
  }
});
