#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dir = process.argv[2] || path.join(__dirname, '..', '..', 'assets', 'dist', 'hero');
const thresholds = {
  heroLodBytes: 1.5 * 1024 * 1024, // 1.5 MB
  fullModelBytes: 6 * 1024 * 1024, // 6 MB
};

function human(n){ return (n/1024).toFixed(1)+' KB' }

if (!fs.existsSync(dir)) {
  console.error('Directory not found:', dir);
  process.exit(2);
}

const files = fs.readdirSync(dir).map(f=>({name:f, size: fs.statSync(path.join(dir,f)).size}));
let heroLod = files.find(f=>/lod|low|hero/i.test(f.name)) || files.find(f=>/draco|glb|gltf/i.test(f.name));
let total = files.reduce((s,f)=>s+f.size,0);

console.log('Artifacts in', dir);
files.forEach(f=> console.log('-', f.name, human(f.size)));

if (heroLod) {
  console.log('\nHero candidate:', heroLod.name, human(heroLod.size));
  if (heroLod.size > thresholds.heroLodBytes) {
    console.warn('Hero LOD exceeds threshold', human(thresholds.heroLodBytes));
    process.exitCode = 1;
  }
} else {
  console.warn('No hero LOD candidate found.');
}

console.log('Total artifacts size:', human(total));
if (total > thresholds.fullModelBytes) {
  console.warn('Total model size exceeds threshold', human(thresholds.fullModelBytes));
  process.exitCode = 1;
}

if (process.exitCode === 0) console.log('\nAll artifact checks passed.');
