const fs = require('fs');
const path = require('path');

// Final comprehensive fixes for template literal issues
const files = [
  'apps/web/src/components/admin/lists-manager.tsx',
  'apps/web/src/components/admin/export-manager.tsx',
  'apps/web/src/components/admin/categories-manager.tsx',
  'apps/web/src/components/admin/books-manager.tsx',
  'apps/web/src/components/admin/add-books-to-list-dialog.tsx'
];

function fixTemplates(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let modified = false;

    // Fix common template literal patterns
    const fixes = [
      // Fix unterminated template literals
      { from: /`([^`]*)'([^']*)`/g, to: '`$1$2`' },

      // Fix mixed quotes in templates
      { from: /'([^']*\$\{[^}]*\}[^']*)`/g, to: '`$1`' },
      { from: /`([^`]*)'$/gm, to: '`$1`' },

      // Fix specific patterns in files
      { from: /'Content-Type`: `application\/json`/g, to: "'Content-Type': 'application/json'" },
      { from: /'PDF`,/g, to: "'PDF'," },
      { from: /'JSON`/g, to: "'JSON'" },
      { from: /format: `PDF`/g, to: "format: 'PDF'" },
      { from: /format: `JSON`/g, to: "format: 'JSON'" },

      // Fix router.push patterns
      { from: /router\.push\('([^']*\$\{[^}]*\}[^']*)'\)/g, to: 'router.push(`$1`)' },

      // Fix img alt patterns
      { from: /alt=\{`Couverture de \$\{[^}]*\}' \}/g, to: 'alt={`Couverture de ${book.titre}`}' },

      // Fix specific broken patterns
      { from: /src=\{book\.image_couverture \|\| '`\}/g, to: "src={book.image_couverture || ''}" },
      { from: /'(\$\{[^}]*\} livre\$\{[^}]*\} [^']*)`/g, to: '`$1`' },

      // Fix date formatting
      { from: /\{format\([^,]+, `([^`]+)`/g, to: "{format(new Date(book.date_lecture), '$1'" },

      // Fix specific quote issues
      { from: /'s ajoutés' : ' ajouté`\}/g, to: "'s ajoutés' : ' ajouté'}" },
      { from: /'ont' : `a`\}/g, to: "'ont' : 'a'}" },
      { from: /'s' : '`\}/g, to: "'s' : ''}" },

      // Fix backtick issues in export
      { from: /minute: `2-digit`/g, to: "minute: '2-digit'" },
      { from: /'Erreur lors du téléchargement`,/g, to: "'Erreur lors du téléchargement'," },

      // Fix className patterns
      { from: /className=\{`([^`]*)'([^']*)`\}/g, to: 'className={`$1$2`}' },

      // Fix closing parentheses
      { from: /router\.push\(`\/books\/\$\{book\.id\}\);/g, to: "router.push(`/books/${book.id}`);" }
    ];

    fixes.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });

    // Manual specific fixes per file
    if (filePath.includes('add-books-to-list-dialog.tsx')) {
      content = content.replace(
        /'Content-Type`: `application\/json`,/g,
        "'Content-Type': 'application/json',"
      );
    }

    if (filePath.includes('lists-manager.tsx')) {
      // Fix API calls
      content = content.replace(
        /apiClient\.get\('\/api\/lists\?\$\{params\.toString\(\)\}'\)/g,
        'apiClient.get(`/api/lists?${params.toString()}`)'
      );
      content = content.replace(
        /apiClient\.get\('\/api\/lists\/\$\{listToDelete\.id\}'/g,
        'apiClient.delete(`/api/lists/${listToDelete.id}`'
      );
      // Fix router.push calls
      content = content.replace(
        /router\.push\('\/books\?collection=\$\{list\.id\}'\)/g,
        'router.push(`/books?collection=${list.id}`)'
      );
      content = content.replace(
        /router\.push\('\/admin\/lists\/\$\{list\.id\}\/manage'\)/g,
        'router.push(`/admin/lists/${list.id}/manage`)'
      );
      content = content.replace(
        /router\.push\('\/admin\/lists\/\$\{list\.id\}\/edit'\)/g,
        'router.push(`/admin/lists/${list.id}/edit`)'
      );
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Final template literal fixes...');
let fixedCount = 0;

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`Processing ${file}...`);
    if (fixTemplates(fullPath)) {
      console.log(`✅ Fixed ${file}`);
      fixedCount++;
    } else {
      console.log(`⏭️  No issues in ${file}`);
    }
  } else {
    console.log(`❌ File not found: ${file}`);
  }
});

console.log(`\n📊 Final result: ${fixedCount} files fixed`);
console.log('🚀 Ready for build test!');