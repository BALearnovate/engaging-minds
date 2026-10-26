const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('t(')) {
      if (line.includes('${') || line.includes('{{') || line.includes('welcome') || line.includes('Subtitle') || line.includes('Progress') || line.includes('Ago') || line.includes('Score') || line.includes('Rate')) {
        console.log(`${filePath} L${idx+1}: ${line.trim()}`);
      }
    }
  });
}

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) searchDir(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) checkFile(p);
  }
}

searchDir('frontend/src');
