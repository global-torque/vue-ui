import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const lock = JSON.parse(await fs.readFile(new URL('../ui-artifacts.lock.json', import.meta.url), 'utf8'));
await fs.mkdir(path.join(root, 'vendor'), { recursive: true });
for (const artifact of lock.artifacts) {
  assert.match(artifact.file, /^global-torque-(ui-primitives|ui-kit|invest-widgets)-0\.1\.0\.tgz$/);
  const bytes = process.argv[2]
    ? await fs.readFile(path.join(path.resolve(process.argv[2]), artifact.file))
    : Buffer.from(await (async () => {
      const url = new URL(artifact.url);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.hostname, 'github.com');
      assert(url.pathname.startsWith('/global-torque/vue-ui/releases/download/'));
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Artifact download failed (${response.status}); use the reviewed release directory as an explicit argument.`);
      return response.arrayBuffer();
    })());
  assert.equal(crypto.createHash('sha512').update(bytes).digest('hex'), artifact.sha512, `Integrity mismatch: ${artifact.file}`);
  await fs.writeFile(path.join(root, 'vendor', artifact.file), bytes);
  console.log(`Verified ${artifact.file}`);
}
