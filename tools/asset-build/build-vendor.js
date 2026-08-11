// Build the offline three.js bundle into assets/dist/vendor/
// Usage:  node tools/asset-build/build-vendor.js
// Reads:   assets/dist/vendor/three-entry.js + node_modules/three
// Writes:  assets/dist/vendor/three-bundle.js (+ .map)

const { build } = require('esbuild');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..', '..');
const entry = path.join(ROOT, 'assets', 'dist', 'vendor', 'three-entry.js');
const outdir = path.join(ROOT, 'assets', 'dist', 'vendor');

if (!fs.existsSync(entry)) {
  console.error(`Entry not found: ${entry}`);
  process.exit(2);
}

build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  target: 'es2020',
  minify: true,
  sourcemap: true,
  outfile: path.join(outdir, 'three-bundle.js'),
  logLevel: 'info',
}).then((r) => {
  const stat = fs.statSync(path.join(outdir, 'three-bundle.js'));
  console.log(`\n✓ three-bundle.js: ${(stat.size / 1024).toFixed(1)} KB`);
  console.log(`  Next step: rebuild draco decoder if three version changed.`);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
