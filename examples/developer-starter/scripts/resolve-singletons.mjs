import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SINGLETON_DEPENDENCIES = ['vue', 'reka-ui'];

// Run resolution in a real ESM process. Node's ordinary import.meta.resolve
// invocation ignores a parent URL unless the experimental resolver is enabled.
const RESOLVER_SOURCE = String.raw`
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const payload = JSON.parse(process.argv[1] ?? '');
const resolveFile = (specifier, parent) => {
  const resolved = import.meta.resolve(specifier, parent);
  const url = new URL(resolved);
  if (url.protocol !== 'file:') throw new Error('Expected a file URL for ' + specifier + ': ' + resolved);
  const file = fileURLToPath(url);
  if (!fs.statSync(file).isFile()) throw new Error('Resolved path is not a file for ' + specifier + ': ' + resolved);
  return resolved;
};
const host = Object.fromEntries(payload.dependencies.map((dependency) => [
  dependency,
  resolveFile(dependency, payload.hostParent),
]));
const packages = Object.fromEntries(payload.packages.map(({ name, parent }) => [
  name,
  Object.fromEntries(payload.dependencies.map((dependency) => [
    dependency,
    resolveFile(dependency, parent),
  ])),
]));
process.stdout.write(JSON.stringify({ host, packages }));
`;

function assertObject(value, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object.`);
}

function exactKeys(value, keys, label) {
  assertObject(value, label);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} has an unexpected shape.`);
}

async function validateFileResult(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a URL string.`);
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    throw new Error(`${label} is not a valid URL: ${value}`, { cause: error });
  }
  assert.equal(url.protocol, 'file:', `${label} must resolve to a file URL: ${value}`);
  let file;
  try {
    file = fileURLToPath(url);
    assert((await fs.stat(file)).isFile(), `${label} must resolve to a file: ${value}`);
  } catch (error) {
    throw new Error(`${label} does not resolve to a readable file: ${value}`, { cause: error });
  }
  return { url: value, file, realpath: await fs.realpath(file) };
}

/**
 * Resolve host singleton peers and every installed package from explicit ESM
 * parent URLs, then compare their realpaths. The subprocess is deliberately
 * bounded to one invocation for the complete installed package set.
 */
export async function resolveHostSingletons({ root, packages }) {
  assert.equal(typeof root, 'string', 'Singleton resolver root must be a path.');
  assert(Array.isArray(packages) && packages.length > 0, 'Singleton resolver needs installed packages.');
  const hostPackageJson = await fs.realpath(path.join(root, 'package.json'));
  const packageInputs = [];
  const packageNames = new Set();
  for (const packageInfo of packages) {
    assertObject(packageInfo, 'Installed package');
    assert.equal(typeof packageInfo.name, 'string', 'Installed package name must be a string.');
    assert(!packageNames.has(packageInfo.name), `Duplicate installed package: ${packageInfo.name}`);
    packageNames.add(packageInfo.name);
    assert.equal(typeof packageInfo.apparentPath, 'string', `Installed package path is missing: ${packageInfo.name}`);
    const realPath = await fs.realpath(packageInfo.apparentPath);
    const packageJson = await fs.realpath(path.join(realPath, 'package.json'));
    packageInputs.push({
      name: packageInfo.name,
      apparentPath: packageInfo.apparentPath,
      realPath,
      parent: pathToFileURL(packageJson).href,
    });
  }
  const payload = JSON.stringify({
    dependencies: SINGLETON_DEPENDENCIES,
    hostParent: pathToFileURL(hostPackageJson).href,
    packages: packageInputs.map(({ name, parent }) => ({ name, parent })),
  });
  let output;
  try {
    output = execFileSync(process.execPath, [
      '--experimental-import-meta-resolve',
      '--input-type=module',
      '--conditions=import',
      '--eval',
      RESOLVER_SOURCE,
      payload,
    ], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024,
    });
  } catch (error) {
    const stderr = error?.stderr?.toString().trim();
    throw new Error(`Singleton resolver subprocess failed${stderr ? `: ${stderr}` : ''}`, { cause: error });
  }
  let resolution;
  try {
    resolution = JSON.parse(output);
  } catch (error) {
    throw new Error(`Singleton resolver returned malformed output: ${output}`, { cause: error });
  }
  assert.equal(output, JSON.stringify(resolution), 'Singleton resolver returned malformed output.');
  exactKeys(resolution, ['host', 'packages'], 'Singleton resolver output');
  exactKeys(resolution.host, SINGLETON_DEPENDENCIES, 'Singleton resolver host output');
  exactKeys(resolution.packages, packageInputs.map(({ name }) => name), 'Singleton resolver package output');

  const hostResults = {};
  for (const dependency of SINGLETON_DEPENDENCIES) {
    hostResults[dependency] = await validateFileResult(resolution.host[dependency], `Host ${dependency}`);
  }
  const packageResults = {};
  for (const packageInfo of packageInputs) {
    exactKeys(resolution.packages[packageInfo.name], SINGLETON_DEPENDENCIES, `${packageInfo.name} resolver output`);
    packageResults[packageInfo.name] = {};
    for (const dependency of SINGLETON_DEPENDENCIES) {
      const result = await validateFileResult(
        resolution.packages[packageInfo.name][dependency],
        `${packageInfo.name} ${dependency}`,
      );
      packageResults[packageInfo.name][dependency] = result;
      const host = hostResults[dependency];
      if (result.realpath !== host.realpath) {
        throw new Error([
          `${packageInfo.name} resolved a duplicate ${dependency}.`,
          `Package path apparent=${packageInfo.apparentPath}; real=${packageInfo.realPath}.`,
          `Resolved=${result.url}; resolved realpath=${result.realpath}.`,
          `Host=${host.url}; host realpath=${host.realpath}.`,
        ].join(' '));
      }
    }
  }
  return { host: hostResults, packages: packageResults };
}
