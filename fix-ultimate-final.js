const fs = require('fs');
const path = require('path');

function findFiles(dir, ext) {
  let results = [];
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules') {
          results = results.concat(findFiles(filePath, ext));
        }
      } else if (ext.some(e => filePath.endsWith(e))) {
        results.push(filePath);
      }
    });
  } catch (e) {}
  return results;
}

const files = findFiles('apps/web/src', ['.ts', '.tsx']);
let totalFixed = 0;

console.log(`\n🔧 RÉPARATION FINALE ULTIME de ${files.length} fichiers...\n`);

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;
    let changes = 0;

    // FIX 1: Template literals cassés - string avec ${} mais pas de backticks
    // Pattern: 'text${var}' ou "text${var}" → `text${var}`
    const oldContent1 = content;
    content = content.replace(/'([^']*\$\{[^}]+\}[^']*?)'/g, '`$1`');
    content = content.replace(/"([^"]*\$\{[^}]+\}[^"]*?)"/g, '`$1`');
    if (content !== oldContent1) changes++;

    // FIX 2: Backtick à la fin au lieu de quote simple/double
    // Pattern: 'something` → 'something'
    const oldContent2 = content;
    content = content.replace(/'([^'$`]{1,200})`(?![,\s]*\})/g, (match, inner) => {
      if (inner.includes('${')) return match; // C'est un vrai template literal
      return `'${inner}'`;
    });
    content = content.replace(/"([^"$`]{1,200})`(?![,\s]*\})/g, (match, inner) => {
      if (inner.includes('${')) return match;
      return `"${inner}"`;
    });
    if (content !== oldContent2) changes++;

    // FIX 3: Quote simple/double à la fin au lieu de backtick
    // Pattern: `something' → `something`
    const oldContent3 = content;
    content = content.replace(/`([^`]*\$\{[^}]+\}[^`]*?)'/g, '`$1`');
    content = content.replace(/`([^`]*\$\{[^}]+\}[^`]*)"/g, '`$1`');
    if (content !== oldContent3) changes++;

    // FIX 4: Doubles backticks
    content = content.replace(/``/g, '`');

    // FIX 5: Espace avant = dans les attributs JSX
    content = content.replace(/(\w+)\s*=\s*"/g, '$1="');

    // FIX 6: Apostrophes françaises cassées
    content = content.replace(/(\w+)"(\w)/g, "$1'$2"); // d"édition → d'édition

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      totalFixed++;
      if (changes > 0) {
        console.log(`✅ ${path.relative('apps/web/src', filePath)}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  ${filePath}: ${error.message}`);
  }
});

console.log(`\n✨ ${totalFixed} fichiers réparés!\n`);
