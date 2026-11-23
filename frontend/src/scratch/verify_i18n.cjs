const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..');
const localesDir = path.join(srcDir, 'i18n', 'locales');

const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const da = JSON.parse(fs.readFileSync(path.join(localesDir, 'da.json'), 'utf8'));
const fi = JSON.parse(fs.readFileSync(path.join(localesDir, 'fi.json'), 'utf8'));
const sv = JSON.parse(fs.readFileSync(path.join(localesDir, 'sv.json'), 'utf8'));

function getNested(obj, keyPath) {
  const parts = keyPath.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr && typeof curr === 'object' && p in curr) {
      curr = curr[p];
    } else {
      return undefined;
    }
  }
  return curr;
}

const keys = new Set();
const keyRegex = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'scratch' && entry.name !== 'node_modules') {
        scanDir(full);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(full, 'utf8');
      let match;
      while ((match = keyRegex.exec(content)) !== null) {
        if (match[1] !== 'key') {
          keys.add(match[1]);
        }
      }
    }
  }
}

scanDir(srcDir);

console.log(`Found ${keys.size} unique translation keys across codebase.\n`);

const langs = [
  { name: 'en', json: en },
  { name: 'da', json: da },
  { name: 'fi', json: fi },
  { name: 'sv', json: sv },
];

let totalMissing = 0;

for (const lang of langs) {
  const missing = [];
  for (const key of Array.from(keys).sort()) {
    const val = getNested(lang.json, key);
    if (val === undefined) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    console.log(`❌ [${lang.name}] Missing ${missing.length} keys:`);
    missing.forEach(k => console.log(`   - ${k}`));
    totalMissing += missing.length;
  } else {
    console.log(`✅ [${lang.name}] 100% key coverage! All ${keys.size} keys present.`);
  }
}

process.exit(totalMissing === 0 ? 0 : 1);
