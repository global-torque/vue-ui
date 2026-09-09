import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const names = ['ui-primitives', 'ui-kit', 'invest-widgets'];
const results = [];
const imports = [];
for (const name of names) {
  const installed = path.join(root, 'node_modules/@global-torque', name);
  const real = await fs.realpath(installed);
  assert(real.startsWith(`${root}${path.sep}`), `Package resolved outside clean consumer: ${name}`);
  const manifest = JSON.parse(await fs.readFile(path.join(installed, 'package.json'), 'utf8'));
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  const archive = path.join(root, 'vendor', `global-torque-${name}-${manifest.version}.tgz`);
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
await fs.writeFile(entry, `${imports.join('\n')}\nexport const entries = [${imports.map((_, i) => `entry${i}`).join(',')}];\n`);
for (const ssr of [false, true]) {
  await build({ configFile: false, root, plugins: [vue()], ssr: { noExternal: true }, build: { ssr, outDir: path.join(temporary, ssr ? 'server' : 'client'), emptyOutDir: true, lib: { entry, formats: ['es'], fileName: 'exports' }, rollupOptions: { external: (id) => /^(vue|reka-ui)(\/|$)/.test(id) || id.startsWith('node:') } } });
}
assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const module = await import(pathToFileURL(path.join(temporary, 'server/exports.js')).href);
assert.equal(module.entries.length, imports.length);
await fs.writeFile(path.join(temporary, 'proof.json'), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify({ packages: results, ssr: 'no browser globals', exports: imports.length }));
