const fs = require('fs');

const fixes = [
  {
    file: 'apps/web/src/components/admin/categories-manager.tsx',
    line: 319,
    from: "'Modifiez les informations de la catégorie`",
    to: "'Modifiez les informations de la catégorie'"
  },
  {
    file: 'apps/web/src/components/admin/lists-manager.tsx',
    line: 209,
    from: 'className="relative rounded-2xl p-6 overflow-hidden`',
    to: 'className="relative rounded-2xl p-6 overflow-hidden"'
  },
  {
    file: 'apps/web/src/components/admin/tags-manager.tsx',
    line: 591,
    from: '<div className="text-sm text-muted-foreground text-center mt-4`>',
    to: '<div className="text-sm text-muted-foreground text-center mt-4">'
  },
  {
    file: 'apps/web/src/components/forms/list-form.tsx',
    line: 329,
    from: 'className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${',
    to: 'className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${'
  },
  {
    file: 'apps/web/src/components/home/hero-section.tsx',
    line: 28,
    from: 'backgroundImage: "url(\\"/images/hero.png\\\')",',
    to: 'backgroundImage: "url(\\"/images/hero.png\\")",'
  }
];

fixes.forEach(fix => {
  if (!fs.existsSync(fix.file)) {
    console.log(`⚠️  File not found: ${fix.file}`);
    return;
  }

  let content = fs.readFileSync(fix.file, 'utf-8');
  const lines = content.split('\n');

  console.log(`\nFixing ${fix.file} line ${fix.line}`);
  console.log(`  Before: ${lines[fix.line - 1].trim()}`);

  // Replace the specific line
  const oldLine = lines[fix.line - 1];
  lines[fix.line - 1] = oldLine.replace(fix.from, fix.to);

  console.log(`  After:  ${lines[fix.line - 1].trim()}`);

  content = lines.join('\n');
  fs.writeFileSync(fix.file, content, 'utf-8');
  console.log(`  ✅ Fixed!`);
});

console.log('\n\n✨ All specific errors fixed!');
