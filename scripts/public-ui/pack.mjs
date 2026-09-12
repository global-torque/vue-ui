import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Source-SFC packages: assembly preserves source bytes and changes only manifest metadata.
const root = process.cwd();
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
const outputArgument = argumentsList.find((argument, index) => (
  !argument.startsWith('-')
  && !(selectedIndex !== -1 && index === selectedIndex + 1 && argumentsList[selectedIndex] === '--package')
));
const output = path.resolve(outputArgument ?? 'artifacts/public-ui');
assert(!fs.existsSync(output), 'Use a new output directory; reviewed artifacts cannot be replaced.');
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const sourceDirty = Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim());
assert(!sourceDirty || process.argv.includes('--allow-dirty'), 'Freeze clean source before release assembly.');
fs.mkdirSync(output, { recursive: true });
const hash = (bytes) => crypto.createHash('sha512').update(bytes).digest('hex');
const ignored = /(^|\/)(__tests__|node_modules|dist|coverage)(\/|$)|\.(test|spec)\.[cm]?[jt]s$/;
const names = selectedPackage ? [selectedPackage] : packageNames;
for (const name of names) {
  const source = path.join(root, 'packages', name);
  const config = JSON.parse(fs.readFileSync(path.join(source, 'public-package.json'), 'utf8'));
  const { manifest } = config;
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.name, `@global-torque/${name}`);
  for (const group of ['dependencies', 'peerDependencies']) {
    for (const [dependency, version] of Object.entries(manifest[group] ?? {})) {
      assert(!dependency.startsWith('@webdevelop-pro/'), `Private dependency: ${dependency}`);
      assert(!/^(workspace:|catalog:|file:|link:)/.test(version), `Unresolved version: ${version}`);
    }
  }
  const stage = path.join(output, name);
  fs.mkdirSync(stage);
  function copy(relative) {
    assert(!path.isAbsolute(relative) && !relative.split('/').includes('..'));
    relative = relative.replace(/^\.\//, '');
    if (ignored.test(relative)) return;
    const entry = path.join(source, relative);
    const stat = fs.lstatSync(entry);
    assert(!stat.isSymbolicLink(), `Source symlink: ${relative}`);
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(entry)) copy(`${relative}/${child}`);
    } else {
      const target = path.join(stage, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(entry, target);
    }
  }
  for (const entry of [...config.sourceFiles, ...config.documentationFiles]) copy(entry);
  fs.copyFileSync(path.join(source, config.readme), path.join(stage, 'README.md'));
  fs.writeFileSync(path.join(stage, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const files = {};
  function inspect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) inspect(file);
      else {
        const relative = path.relative(stage, file);
        const bytes = fs.readFileSync(file);
        files[relative] = hash(bytes);
        if (/\.(ts|vue|css|scss)$/.test(relative)) {
          assert(!/@webdevelop-pro\/|workspace:|catalog:|import\.meta\.env(?!\.(?:DEV|PROD|SSR)\b)/.test(bytes.toString()), `Private source coupling in ${relative}`);
        }
      }
    }
  }
  inspect(stage);
  for (const target of Object.values(manifest.exports)) {
    assert.equal(typeof target, 'string');
    assert(!target.includes('*') && fs.existsSync(path.join(stage, target)), `Unresolved export ${target}`);
  }
  const packed = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', output], { cwd: stage, encoding: 'utf8' }));
  const [result] = Object.values(packed);
  const archive = path.join(output, result.filename);
  const bytes = fs.readFileSync(archive);
  assert.deepEqual(result.files.map((f) => f.path).sort(), Object.keys(files).sort(), 'npm file allowlist differs');
  const proof = { schemaVersion: 1, package: manifest.name, version: manifest.version, sourceCommit, sourceDirty, artifact: result.filename, sha512: hash(bytes), integrity: `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`, files };
  fs.writeFileSync(`${archive}.manifest.json`, `${JSON.stringify(proof, null, 2)}\n`);
  fs.writeFileSync(`${archive}.sha512`, `${proof.sha512}  ${result.filename}\n`);
  console.log(`${manifest.name}@${manifest.version}: ${Object.keys(files).length} files; sourceDirty=${sourceDirty}`);
}

if (selectedPackage) {
  const descriptor = JSON.parse(fs.readFileSync(path.join(root, 'packages', selectedPackage, 'public-package.json'), 'utf8'));
  const proof = JSON.parse(fs.readFileSync(
    path.join(output, `global-torque-${selectedPackage}-${descriptor.manifest.version}.tgz.manifest.json`),
    'utf8',
  ));
  const receipt = {
    schemaVersion: 1,
    selection: 'single-package',
    package: descriptor.manifest.name,
    version: descriptor.manifest.version,
    sourceCommit,
    sourceDirty,
    artifact: proof.artifact,
    sha512: proof.sha512,
    integrity: proof.integrity,
    unchangedPackages: packageNames.filter((name) => name !== selectedPackage).map((name) => {
      const unchanged = JSON.parse(fs.readFileSync(path.join(root, 'packages', name, 'public-package.json'), 'utf8'));
      return { name: unchanged.manifest.name, version: unchanged.manifest.version, source: 'registry' };
    }),
  };
  fs.writeFileSync(path.join(output, 'selected-release.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(`selected release: ${descriptor.manifest.name}@${descriptor.manifest.version}`);
}
