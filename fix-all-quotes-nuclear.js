const fs = require('fs');
const path = require('path');

const files = [
  'apps/web/src/lib/utils.ts',
  'apps/web/src/utils/orpc.ts',
  'apps/web/src/app/admin/activity/page.tsx',
  'apps/web/src/app/admin/books/[id]/edit/page.tsx',
  'apps/web/src/app/admin/books/new/page.tsx'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    return;
  }

  console.log(`\n📝 Processing ${filePath}...`);

  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;

  // FIX 1: Template literals with wrong ending quote
  // `something${var}' → `something${var}`
  const oldContent1 = content;
  content = content.replace(/`([^`]*?\$\{[^}]+\}[^`]*?)'/g, '`$1`');
  if (content !== oldContent1) {
    changes++;
    console.log(`  ✓ Fixed template literals with wrong ending quote`);
  }

  // FIX 2: Template literals with wrong starting quote
  // 'something${var}` → `something${var}`
  const oldContent2 = content;
  content = content.replace(/'([^']*?\$\{[^}]+\}[^']*?)`/g, '`$1`');
  if (content !== oldContent2) {
    changes++;
    console.log(`  ✓ Fixed template literals with wrong starting quote`);
  }

  // FIX 3: String with wrong ending
  // "something' → "something"
  const oldContent3 = content;
  content = content.replace(/"([^"]*?)'/g, (match, inner) => {
    // Don't fix if it contains ${
    if (inner.includes('${')) return match;
    return `"${inner}"`;
  });
  if (content !== oldContent3) {
    changes++;
    console.log(`  ✓ Fixed strings with wrong ending quote`);
  }

  // FIX 4: String with wrong starting
  // 'something" → 'something'
  const oldContent4 = content;
  content = content.replace(/'([^']*?)"/g, (match, inner) => {
    // Don't fix if it contains ${
    if (inner.includes('${')) return match;
    return `'${inner}'`;
  });
  if (content !== oldContent4) {
    changes++;
    console.log(`  ✓ Fixed strings with wrong starting quote`);
  }

  // FIX 5: Double backtick at start of template literal
  // ``${var}` → `${var}`
  const oldContent5 = content;
  content = content.replace(/``([^`]*?\$\{[^}]+\}[^`]*?)`/g, '`$1`');
  if (content !== oldContent5) {
    changes++;
    console.log(`  ✓ Fixed double backticks at start`);
  }

  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ ${changes} fixes applied`);
  } else {
    console.log(`  ℹ️  No issues found`);
  }
});

console.log('\n✨ Done!');
