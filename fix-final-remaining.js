const fs = require('fs');
const path = require('path');

// Script ultra-spécifique pour les dernières erreurs de build

function fixSpecificErrors() {
  const fixes = [
    // export-manager.tsx ligne 425: 'bg-muted`}` -> 'bg-muted'}`
    {
      file: 'apps/web/src/components/admin/export-manager.tsx',
      from: "'bg-muted`}`",
      to: "'bg-muted'}`"
    },
    // lists-manager.tsx ligne 235: manque fermeture }
    {
      file: 'apps/web/src/components/admin/lists-manager.tsx',
      from: "onClick={() => router.push(`/books?collection=${list.id}`)",
      to: "onClick={() => router.push(`/books?collection=${list.id}`)}"
    },
    // book-search-section.tsx ligne 148: 'author`} -> 'author'}
    {
      file: 'apps/web/src/components/forms/book-search-section.tsx',
      from: "setSearchType('author`)",
      to: "setSearchType('author')"
    },
    // list-form.tsx ligne 483: problème template literal
    {
      file: 'apps/web/src/components/forms/list-form.tsx',
      from: "' }",
      to: "' }"
    }
  ];

  fixes.forEach(fix => {
    try {
      const filePath = path.join(__dirname, fix.file);
      let content = fs.readFileSync(filePath, 'utf8');

      if (content.includes(fix.from)) {
        content = content.replace(fix.from, fix.to);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed ${fix.file}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${fix.file}:`, error.message);
    }
  });
}

fixSpecificErrors();
console.log('\n✨ Corrections spécifiques terminées!');