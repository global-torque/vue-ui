import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const packer = path.join(root, 'scripts/public-ui/pack.mjs');

function temporaryOutput(prefix) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const output = path.join(directory, 'release');
  return { directory, output };
}

test('selected pack emits only UI Kit and its receipt', () => {
  const { directory, output } = temporaryOutput('vue-ui-pack-selected-');
  try {
    execFileSync(process.execPath, [packer, output, '--package', 'ui-kit', '--allow-dirty'], { cwd: root, stdio: 'pipe' });
    assert(fs.existsSync(path.join(output, 'global-torque-ui-kit-0.4.2.tgz')));
    assert(fs.existsSync(path.join(output, 'selected-release.json')));
    assert(!fs.existsSync(path.join(output, 'global-torque-ui-primitives-0.2.2.tgz')));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('default pack includes only active UI packages', () => {
  const { directory, output } = temporaryOutput('vue-ui-pack-legacy-');
  try {
    execFileSync(process.execPath, [packer, output, '--allow-dirty'], { cwd: root, stdio: 'pipe' });
    for (const name of ['ui-primitives-0.2.2', 'ui-kit-0.4.2']) {
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
