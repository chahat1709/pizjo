// Copy draco decoder files from node_modules into assets/dist/vendor/draco/.
// Usage:  node tools/asset-build/build-draco.js
//
// Why: three.js GLTFLoader with DRACO compression needs the decoder WASM/JS
// files available at a URL the browser can fetch. We serve them from our own
// assets so we don't hit a CDN at runtime. (PR-2 hardening.)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco', 'gltf');
const DST = path.join(ROOT, 'assets', 'dist', 'vendor', 'draco');

if (!fs.existsSync(SRC)) {
  console.error(`Source draco dir not found: ${SRC}`);
  console.error(`Run \`npm install\` first.`);
  process.exit(2);
}

fs.mkdirSync(DST, { recursive: true });

let copied = 0;
for (const fn of fs.readdirSync(SRC)) {
  const s = path.join(SRC, fn);
  const d = path.join(DST, fn);
  if (fs.statSync(s).isFile()) {
    fs.copyFileSync(s, d);
    copied++;
  }
}

console.log(`✓ copied ${copied} draco files to assets/dist/vendor/draco/`);
for (const fn of fs.readdirSync(DST).sort()) {
  const p = path.join(DST, fn);
  if (fs.statSync(p).isFile()) {
    console.log(`  ${fn}  ${(fs.statSync(p).size / 1024).toFixed(1)} KB`);
  }
}
