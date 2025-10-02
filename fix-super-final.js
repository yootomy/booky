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

console.log(`\n🔧 SUPER FINAL FIX de ${files.length} fichiers...\n`);

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // FIX 1: 'text" → 'text'
    content = content.replace(/'([^'"$`\n]{1,100})"/g, "'$1'");

    // FIX 2: "text' → "text"
    content = content.replace(/"([^'"$`\n]{1,100})'/g, '"$1"');

    // FIX 3: className=` → className="
    content = content.replace(/className=`([^`$\n{]{1,100})"/g, 'className="$1"');

    // FIX 4: style={{ ... "text' → style={{ ... "text"
    content = content.replace(/(style=\{[^}]{0,200})"([^"]{1,50})'/g, '$1"$2"');

    // FIX 5: mode: 'text` → mode: 'text'
    content = content.replace(/:\s*'([^'$`\n]{1,50})`/g, ": '$1'");

    // FIX 6: Mixed quotes in JSX string expressions {tag ? "s' : ''} → {tag ? 's' : ''}
    content = content.replace(/\? "([^"]*?)'/g, "? '$1'");

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      totalFixed++;
      console.log(`✅ ${path.relative('apps/web/src', filePath)}`);
    }
  } catch (error) {
    // Ignore errors
  }
});

console.log(`\n✨ ${totalFixed} fichiers réparés!\n`);
