const fs = require('fs');
const path = require('path');

const config = {
  maxJsGzip: 200 * 1024,
  maxHeroTexture: 2 * 1024 * 1024,
  maxHeroModel: 1.5 * 1024 * 1024,
};

function checkFile(p, max){
  if (!fs.existsSync(p)) return { ok: false, reason: 'missing' };
  const s = fs.statSync(p).size;
  return { ok: s <= max, size: s };
}

function main(){
  const out = { checks: {} };
  const jsCandidate = path.join(__dirname, '..', '..', 'dist', 'bundle.js');
  out.checks.js = checkFile(jsCandidate, config.maxJsGzip);
  const heroTex = path.join(__dirname, '..', '..', 'assets', 'dist', 'hero', 'hero.ktx2');
  out.checks.heroTexture = checkFile(heroTex, config.maxHeroTexture);
  const heroModel = path.join(__dirname, '..', '..', 'assets', 'dist', 'hero', 'hero_draco.glb');
  out.checks.heroModel = checkFile(heroModel, config.maxHeroModel);
  console.log(JSON.stringify(out, null, 2));
  const allOk = Object.values(out.checks).every(c=>c.ok);
  process.exit(allOk?0:1);
}

if (require.main === module) main();
