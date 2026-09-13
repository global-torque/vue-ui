import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolveHostSingletons } from '../../examples/developer-starter/scripts/resolve-singletons.mjs';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const packer = path.join(root, 'scripts/public-ui/pack.mjs');
const consumerCreator = path.join(root, 'scripts/public-ui/create-consumer.mjs');
const bootstrapScript = path.join(root, 'examples/developer-starter/scripts/bootstrap-ui.mjs');
const activePackageNames = ['ui-primitives', 'ui-kit'];
const legacyPackageNames = ['invest-widgets'];
const packageNames = [...activePackageNames, ...legacyPackageNames];

function temporaryOutput(prefix) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const output = path.join(directory, 'release');
  return { directory, output };
}

function digest(bytes) {
  return crypto.createHash('sha512').update(bytes).digest('hex');
}

function artifact({ name, version, source, selection, includeMetadata = true }) {
  const file = `global-torque-${name}-${version}.tgz`;
  const bytes = Buffer.from(`fixture archive ${file}`);
  const url = source === 'candidate'
    ? `https://github.com/global-torque/vue-ui/releases/download/${selection === 'single-package' ? `${name}-v${version}` : `v${version}`}/${file}`
    : `https://registry.npmjs.org/@global-torque/${name}/-/${name}-${version}.tgz`;
  return {
    ...(includeMetadata ? { name: `@global-torque/${name}`, version, source } : {}),
    file,
    sha512: digest(bytes),
    ...(includeMetadata ? { integrity: `sha512-${Buffer.from(digest(bytes), 'hex').toString('base64')}` } : {}),
    url,
    bytes,
  };
}

function bootstrapFixture(lock, dependencyVersions = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vue-ui-bootstrap-'));
  const consumer = path.join(directory, 'consumer');
  const archives = path.join(directory, 'archives');
  fs.mkdirSync(path.join(consumer, 'scripts'), { recursive: true });
  fs.mkdirSync(archives);
  fs.copyFileSync(bootstrapScript, path.join(consumer, 'scripts/bootstrap-ui.mjs'));
  fs.writeFileSync(path.join(consumer, 'ui-artifacts.lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
  fs.writeFileSync(path.join(consumer, 'package.json'), `${JSON.stringify({
    name: 'bootstrap-fixture',
    private: true,
    type: 'module',
    dependencies: Object.fromEntries(packageNames.map((name) => [`@global-torque/${name}`, dependencyVersions[name] ?? '0.1.3'])),
  }, null, 2)}\n`);
  for (const entry of lock.artifacts) {
    const fixture = entry.bytes;
    if (fixture) fs.writeFileSync(path.join(archives, entry.file), fixture);
  }
  return { directory, consumer, archives };
}

function runBootstrap(fixture) {
  return execFileSync(process.execPath, [path.join(fixture.consumer, 'scripts/bootstrap-ui.mjs'), fixture.archives], {
    cwd: fixture.consumer,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

function expectBootstrapFailure(fixture, message) {
  assert.throws(() => runBootstrap(fixture), message ? new RegExp(message) : undefined);
}

function singletonFixture(localDependency) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vue-ui-singleton-'));
  const consumer = path.join(directory, 'consumer');
  const storePackage = path.join(consumer, 'store', 'ui-kit');
  const apparentPackage = path.join(consumer, 'node_modules/@global-torque/ui-kit');
  fs.mkdirSync(path.join(consumer, 'node_modules/vue'), { recursive: true });
  fs.mkdirSync(path.join(consumer, 'node_modules/reka-ui'), { recursive: true });
  fs.mkdirSync(path.join(storePackage, 'node_modules'), { recursive: true });
  fs.mkdirSync(path.dirname(apparentPackage), { recursive: true });
  fs.writeFileSync(path.join(consumer, 'package.json'), '{"name":"singleton-fixture","type":"module"}\n');
  for (const dependency of ['vue', 'reka-ui']) {
    const dependencyRoot = path.join(consumer, 'node_modules', dependency);
    fs.writeFileSync(path.join(dependencyRoot, 'package.json'), `${JSON.stringify({
      name: dependency,
      version: '1.0.0',
      type: 'module',
      exports: { '.': './index.mjs' },
    })}\n`);
    fs.writeFileSync(path.join(dependencyRoot, 'index.mjs'), `export const packageName = ${JSON.stringify(dependency)};\n`);
  }
  fs.writeFileSync(path.join(storePackage, 'package.json'), '{"name":"@global-torque/ui-kit","version":"0.1.4"}\n');
  if (localDependency) {
    const localRoot = path.join(storePackage, 'node_modules', localDependency);
    fs.mkdirSync(localRoot, { recursive: true });
    fs.writeFileSync(path.join(localRoot, 'package.json'), `${JSON.stringify({
      name: localDependency,
      version: '0.9.0-local',
      type: 'module',
      exports: { '.': './index.mjs' },
    })}\n`);
    fs.writeFileSync(path.join(localRoot, 'index.mjs'), `export const packageName = ${JSON.stringify(`${localDependency}-local`)};\n`);
  }
  fs.symlinkSync(storePackage, apparentPackage, 'dir');
  return { directory, consumer, apparentPackage };
}

async function assertSingletonFailure(localDependency) {
  const fixture = singletonFixture(localDependency);
  try {
    await assert.rejects(
      resolveHostSingletons({
        root: fixture.consumer,
        packages: [{ name: '@global-torque/ui-kit', apparentPath: fixture.apparentPackage }],
      }),
      (error) => {
        assert.match(error.message, new RegExp(`@global-torque/ui-kit resolved a duplicate ${localDependency}\\.`));
        assert(error.message.includes(`Package path apparent=${fixture.apparentPackage};`));
        assert(error.message.includes(`real=${fs.realpathSync(fixture.apparentPackage)}.`));
        assert(error.message.includes(`resolved realpath=${fs.realpathSync(path.join(fixture.consumer, 'store/ui-kit/node_modules', localDependency, 'index.mjs'))}.`));
        assert(error.message.includes('host realpath='));
        return true;
      },
    );
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
}

test('selected pack emits only UI Kit and its receipt', () => {
  const { directory, output } = temporaryOutput('vue-ui-pack-selected-');
  try {
    execFileSync(process.execPath, [packer, output, '--package', 'ui-kit', '--allow-dirty'], { cwd: root, stdio: 'pipe' });
    assert(fs.existsSync(path.join(output, 'global-torque-ui-kit-0.1.4.tgz')));
    assert(fs.existsSync(path.join(output, 'selected-release.json')));
    assert(!fs.existsSync(path.join(output, 'global-torque-ui-primitives-0.1.3.tgz')));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('default pack includes only active UI packages', () => {
  const { directory, output } = temporaryOutput('vue-ui-pack-legacy-');
  try {
    execFileSync(process.execPath, [packer, output, '--allow-dirty'], { cwd: root, stdio: 'pipe' });
    for (const name of ['ui-primitives-0.1.3', 'ui-kit-0.1.4']) {
      assert(fs.existsSync(path.join(output, `global-torque-${name}.tgz`)));
    }
    assert(!fs.existsSync(path.join(output, 'global-torque-invest-widgets-0.1.3.tgz')));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('invest-widgets cannot be selected for a new UI release', () => {
  const { directory, output } = temporaryOutput('vue-ui-pack-retired-');
  try {
    assert.throws(
      () => execFileSync(process.execPath, [packer, output, '--package', 'invest-widgets', '--allow-dirty'], { cwd: root, stdio: 'pipe' }),
      /Unknown package selection/,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('selected consumer creation rejects a tampered selected receipt', () => {
  const { directory: packDirectory, output } = temporaryOutput('vue-ui-pack-tamper-');
  const consumer = path.join(packDirectory, 'consumer');
  try {
    execFileSync(process.execPath, [packer, output, '--package', 'ui-kit', '--allow-dirty'], { cwd: root, stdio: 'pipe' });
    const receiptPath = path.join(output, 'selected-release.json');
    const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    receipt.sha512 = 'tampered';
    fs.writeFileSync(receiptPath, `${JSON.stringify(receipt)}\n`);
    assert.throws(
      () => execFileSync(process.execPath, [consumerCreator, output, consumer, '--package', 'ui-kit'], { cwd: root, stdio: 'pipe' }),
      /AssertionError|ERR_ASSERTION/,
    );
  } finally {
    fs.rmSync(packDirectory, { recursive: true, force: true });
  }
});

test('selected consumer keeps the retired widget on its frozen registry identity', () => {
  const { directory: packDirectory, output } = temporaryOutput('vue-ui-pack-consumer-');
  const consumer = path.join(packDirectory, 'consumer');
  try {
    execFileSync(process.execPath, [packer, output, '--package', 'ui-kit', '--allow-dirty'], { cwd: root, stdio: 'pipe' });
    execFileSync(process.execPath, [consumerCreator, output, consumer, '--package', 'ui-kit'], { cwd: root, stdio: 'pipe' });
    const lock = JSON.parse(fs.readFileSync(path.join(consumer, 'ui-artifacts.lock.json'), 'utf8'));
    const widget = lock.artifacts.find(({ name }) => name === '@global-torque/invest-widgets');
    assert.deepEqual(widget, {
      name: '@global-torque/invest-widgets',
      version: '0.1.3',
      source: 'registry',
      file: 'global-torque-invest-widgets-0.1.3.tgz',
      sha512: 'c2bc2fd539bf8214f90a8ba189c1a2bc32ad3cd7fe78bb3e349788f27eaafc9f82f67ad3b61114b0073539b6d3205dd81c3706c59ea6375bb712483bd646cb6a',
      integrity: 'sha512-wrwv1Tm/ghT5CouhicGivDKtPNf+eLs+NJeI8n6q/J+C9nrTthEUsAc1ObbTIF3YHDcGxZ6mN1u3Ekg71kbLag==',
      url: 'https://registry.npmjs.org/@global-torque/invest-widgets/-/invest-widgets-0.1.3.tgz',
    });
    const packageJson = JSON.parse(fs.readFileSync(path.join(consumer, 'package.json'), 'utf8'));
    assert.equal(packageJson.dependencies['@global-torque/invest-widgets'], '0.1.3');
  } finally {
    fs.rmSync(packDirectory, { recursive: true, force: true });
  }
});

test('primitive selection keeps exact receipt versions in the generated manifest', () => {
  const { directory: packDirectory, output } = temporaryOutput('vue-ui-pack-primitive-consumer-');
  const consumer = path.join(packDirectory, 'consumer');
  try {
    execFileSync(process.execPath, [packer, output, '--package', 'ui-primitives', '--allow-dirty'], { cwd: root, stdio: 'pipe' });
    execFileSync(process.execPath, [consumerCreator, output, consumer, '--package', 'ui-primitives'], { cwd: root, stdio: 'pipe' });
    const lock = JSON.parse(fs.readFileSync(path.join(consumer, 'ui-artifacts.lock.json'), 'utf8'));
    assert.equal(lock.selected.name, '@global-torque/ui-primitives');
    assert.equal(lock.selected.version, '0.1.3');
    const packageJson = JSON.parse(fs.readFileSync(path.join(consumer, 'package.json'), 'utf8'));
    for (const artifact of lock.artifacts) {
      assert.equal(packageJson.dependencies[artifact.name], artifact.version, `Generated manifest version mismatch for ${artifact.name}`);
    }
  } finally {
    fs.rmSync(packDirectory, { recursive: true, force: true });
  }
});

test('unknown package selections fail before assembly', () => {
  const { directory, output } = temporaryOutput('vue-ui-pack-invalid-');
  try {
    assert.throws(
      () => execFileSync(process.execPath, [packer, output, '--package', 'unknown', '--allow-dirty'], { cwd: root, stdio: 'pipe' }),
      /Unknown package selection/,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('legacy registry locks accept explicit local archives without dependency overlays', () => {
  const artifacts = packageNames.map((name) => artifact({ name, version: '0.1.3', source: 'registry', includeMetadata: false }));
  const fixture = bootstrapFixture({ status: 'legacy registry lock', artifacts });
  try {
    runBootstrap(fixture);
    const packageJson = JSON.parse(fs.readFileSync(path.join(fixture.consumer, 'package.json'), 'utf8'));
    assert.deepEqual(packageJson.dependencies, Object.fromEntries(packageNames.map((name) => [`@global-torque/${name}`, '0.1.3'])));
    for (const entry of artifacts) assert.equal(digest(fs.readFileSync(path.join(fixture.consumer, 'vendor', entry.file))), entry.sha512);
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('selected locks overlay only the candidate package', () => {
  const artifacts = [
    artifact({ name: 'ui-primitives', version: '0.1.3', source: 'registry', selection: 'single-package' }),
    artifact({ name: 'ui-kit', version: '0.1.4', source: 'candidate', selection: 'single-package' }),
    artifact({ name: 'invest-widgets', version: '0.1.3', source: 'registry', selection: 'single-package' }),
  ];
  const fixture = bootstrapFixture({ status: 'selected candidate lock', selection: 'single-package', artifacts }, { 'ui-kit': '0.1.4' });
  try {
    runBootstrap(fixture);
    const packageJson = JSON.parse(fs.readFileSync(path.join(fixture.consumer, 'package.json'), 'utf8'));
    assert.equal(packageJson.dependencies['@global-torque/ui-kit'], 'file:vendor/global-torque-ui-kit-0.1.4.tgz');
    assert.equal(packageJson.dependencies['@global-torque/ui-primitives'], '0.1.3');
    assert.equal(packageJson.dependencies['@global-torque/invest-widgets'], '0.1.3');
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('all-package locks overlay every candidate package', () => {
  const artifacts = packageNames.map((name) => artifact({ name, version: '0.1.3', source: 'candidate', selection: 'all-packages' }));
  const fixture = bootstrapFixture({ status: 'all candidate lock', selection: 'all-packages', artifacts });
  try {
    runBootstrap(fixture);
    const packageJson = JSON.parse(fs.readFileSync(path.join(fixture.consumer, 'package.json'), 'utf8'));
    for (const name of packageNames) assert.equal(packageJson.dependencies[`@global-torque/${name}`], `file:vendor/global-torque-${name}-0.1.3.tgz`);
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('artifact identity, source, URL and digest contradictions are rejected before local fallback', () => {
  const valid = packageNames.map((name) => artifact({ name, version: '0.1.3', source: 'registry', selection: 'all-packages' }));
  const cases = [
    ['bad URL', (entries) => { entries[0].url = 'https://registry.npmjs.org/@global-torque/ui-kit/-/ui-kit-0.1.3.tgz'; }, 'does not match its identity'],
    ['bad identity', (entries) => { entries[0].name = '@global-torque/ui-kit'; }, 'contradicts filename'],
    ['bad source', (entries) => { entries[0].source = 'candidate'; }, 'contradicts URL'],
    ['bad digest', (entries) => { entries[0].sha512 = '0'.repeat(128); entries[0].integrity = `sha512-${Buffer.from(entries[0].sha512, 'hex').toString('base64')}`; }, 'Integrity mismatch'],
  ];
  for (const [, mutate, message] of cases) {
    const entries = valid.map((entry) => ({ ...entry }));
    mutate(entries);
    const fixture = bootstrapFixture({ status: 'invalid lock', selection: 'all-packages', artifacts: entries });
    try {
      expectBootstrapFailure(fixture, message);
    } finally {
      fs.rmSync(fixture.directory, { recursive: true, force: true });
    }
  }
});

test('duplicate normalized identities and undeclared candidate dependencies are rejected', () => {
  const entries = packageNames.map((name) => artifact({ name, version: '0.1.3', source: 'registry', selection: 'all-packages' }));
  entries.push({ ...entries[0], name: 'ui-primitives' });
  const duplicateFixture = bootstrapFixture({ status: 'duplicate lock', selection: 'all-packages', artifacts: entries });
  try {
    expectBootstrapFailure(duplicateFixture, 'Duplicate artifact identity');
  } finally {
    fs.rmSync(duplicateFixture.directory, { recursive: true, force: true });
  }

  const candidate = packageNames.map((name) => artifact({ name, version: '0.1.3', source: 'candidate', selection: 'all-packages' }));
  const dependencyFixture = bootstrapFixture({ status: 'candidate dependency lock', selection: 'all-packages', artifacts: candidate });
  const packageJsonPath = path.join(dependencyFixture.consumer, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  delete packageJson.dependencies['@global-torque/ui-kit'];
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  try {
    expectBootstrapFailure(dependencyFixture, 'Candidate dependency is not declared');
  } finally {
    fs.rmSync(dependencyFixture.directory, { recursive: true, force: true });
  }
});

test('singleton resolver accepts shared Vue and Reka from a symlinked package layout', async () => {
  const fixture = singletonFixture();
  try {
    await resolveHostSingletons({
      root: fixture.consumer,
      packages: [{ name: '@global-torque/ui-kit', apparentPath: fixture.apparentPackage }],
    });
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('singleton resolver reports a package-local Vue with apparent and real paths', async () => {
  await assertSingletonFailure('vue');
});

test('singleton resolver reports a package-local Reka with the correct dependency', async () => {
  await assertSingletonFailure('reka-ui');
});
