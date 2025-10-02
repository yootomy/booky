const fs = require('fs');
const path = require('path');

function findFiles(dir, ext) {
  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findFiles(filePath, ext));
    } else if (ext.some(e => filePath.endsWith(e))) {
      results.push(filePath);
    }
  });

  return results;
}

const files = findFiles('apps/web/src', ['.ts', '.tsx']);

console.log(`Found ${files.length} files to process\n`);

let totalChanges = 0;

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // FIX 1: Template literals with mixed ending `...${var}'
    content = content.replace(/`([^`]*?\$\{[^}]+\}[^`]*?)'/g, '`$1`');

    // FIX 2: Template literals with mixed starting '...${var}`
    content = content.replace(/'([^']*?\$\{[^}]+\}[^']*?)`/g, '`$1`');

    // FIX 3: Double backtick at start ``${var}`
    content = content.replace(/``([^`]*?\$\{[^}]+\}[^`]*?)`/g, '`$1`');

    // FIX 4: String ending with wrong quote type "something'
    content = content.replace(/"([^"$\n]{0,200})'/g, (match, inner) => {
      if (inner.includes('${')) return match;
      if (inner.includes('\\')) return match;
      return `"${inner}"`;
    });

    // FIX 5: String starting with wrong quote type 'something"
    content = content.replace(/'([^'$\n]{0,200})"/g, (match, inner) => {
      if (inner.includes('${')) return match;
      if (inner.includes('\\')) return match;
      return `'${inner}'`;
    });

    // FIX 6: Backtick inside regular strings should be quote
    content = content.replace(/(\w+)"`/g, '$1"');
    content = content.replace(/(\w+)'`/g, "$1'");

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      totalChanges++;
    }
  } catch (error) {
    console.log(`⚠️  Error processing ${filePath}: ${error.message}`);
  }
});

console.log(`\n✅ Fixed ${totalChanges} files!`);
