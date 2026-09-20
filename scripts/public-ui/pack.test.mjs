import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolveHostSingletons } from '../../examples/developer-starter/scripts/resolve-singletons.mjs';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const packer = path.join(root, 'scripts/public-ui/pack.mjs');
const activePackageNames = ['ui-primitives', 'ui-kit'];

function temporaryOutput(prefix) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const output = path.join(directory, 'release');
  return { directory, output };
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
