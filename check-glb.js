const fs = require('fs');
const path = process.argv[2] || 'assets/dist/hero/hero_draco.glb';
const buf = fs.readFileSync(path);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
console.log('FILE:', path);
console.log('animations:', JSON.stringify((json.animations||[]).map(a=>({name:a.name, channels:(a.channels||[]).length, samplers:(a.samplers||[]).length}))));
console.log('materials:', (json.materials||[]).length, 'meshes:', (json.meshes||[]).length, 'nodes:', (json.nodes||[]).length);
console.log('extensionsUsed:', json.extensionsUsed || []);
