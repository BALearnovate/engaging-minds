const fs = require('fs');
const path = require('path');

const files = [
  { path: 'frontend/src/i18n/locales/en.json', lang: 'en' },
  { path: 'frontend/src/i18n/locales/da.json', lang: 'da' },
  { path: 'frontend/src/i18n/locales/fi.json', lang: 'fi' },
  { path: 'frontend/src/i18n/locales/sv.json', lang: 'sv' },
  { path: 'frontend/public/locales/en/translation.json', lang: 'en' },
  { path: 'frontend/public/locales/en-GB/translation.json', lang: 'en' },
  { path: 'frontend/public/locales/da/translation.json', lang: 'da' },
  { path: 'frontend/public/locales/fi/translation.json', lang: 'fi' },
  { path: 'frontend/public/locales/sv/translation.json', lang: 'sv' },
];

const translations = {
  en: {
    noStudentsNeedHelp: "No students need help",
    studentsNeedHelp: "{{count}} students need help"
  },
  da: {
    noStudentsNeedHelp: "Ingen elever har brug for hjælp",
    studentsNeedHelp: "{{count}} elever har brug for hjælp"
  },
  fi: {
    noStudentsNeedHelp: "Kukaan oppilas ei tarvitse apua",
    studentsNeedHelp: "{{count}} oppilasta tarvitsee apua"
  },
  sv: {
    noStudentsNeedHelp: "Inga elever behöver hjälp",
    studentsNeedHelp: "{{count}} elever behöver hjälp"
  }
};

files.forEach(({ path: filePath, lang }) => {
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.liveDashboard) data.liveDashboard = {};
    data.liveDashboard.noStudentsNeedHelp = translations[lang].noStudentsNeedHelp;
    data.liveDashboard.studentsNeedHelp = translations[lang].studentsNeedHelp;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${filePath}`);
  }
});
