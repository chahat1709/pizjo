const fs = require('fs');
const path = require('path');

const reviewPath = path.join(__dirname, '..', 'docs', 'review-v2.md');

function readScore(content){
  const m = content.match(/\*\*Total\*\* \| \*\*(\d+(?:\.\d+)?) \/ 10\*\*/);
  if (m) return parseFloat(m[1]);
  const m2 = content.match(/\| \*\*Total\*\* \| \*\*(\d+(?:\.\d+)?) \/ 10\*\*/);
  if (m2) return parseFloat(m2[1]);
  const m3 = content.match(/\*\*Total\*\* \| \*\*(\d+(?:\.\d+)?)/);
  if (m3) return parseFloat(m3[1]);
  return null;
}

function main(){
  if (!fs.existsSync(reviewPath)){
    console.error('review file missing:', reviewPath);
    process.exit(2);
  }
  const content = fs.readFileSync(reviewPath,'utf8');
  const score = readScore(content);
  console.log('Current review score:', score);
  if (score >= 9.5){
    const note = `\n\n> Loop status: reviewer threshold met (>= 9.5). Loop completed on ${new Date().toISOString()}.`;
    if (!content.includes('Loop status: reviewer threshold met')){
      fs.appendFileSync(reviewPath, note);
      console.log('Appended loop completion note to review-v2.md');
    } else {
      console.log('Loop already marked complete.');
    }
    process.exit(0);
  }

  console.log('Score below threshold — automated fixes are required (not implemented).');
  process.exit(1);
}

if (require.main === module) main();
