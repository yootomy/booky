const fs = require('fs');
const path = require('path');

// Script pour corriger les erreurs de template literals restantes
// Plus robuste et spécifique

const fixes = [
  // Pattern: toLocaleString('fr-FR`) -> toLocaleString('fr-FR')
  {
    pattern: /toLocaleString\('fr-FR`\)/g,
    replacement: "toLocaleString('fr-FR')"
  },
  // Pattern: 'outline`} -> 'outline'}
  {
    pattern: /'outline`\}/g,
    replacement: "'outline'}"
  },
  // Pattern: 'password`} -> 'password'}
  {
    pattern: /'password`\}/g,
    replacement: "'password'}"
  },
  // Pattern: 'email`} -> 'email'}
  {
    pattern: /'email`\}/g,
    replacement: "'email'}"
  },
  // Pattern: toLocaleDateString('fr-FR`) -> toLocaleDateString('fr-FR')
  {
    pattern: /toLocaleDateString\('fr-FR`\)/g,
    replacement: "toLocaleDateString('fr-FR')"
  },
  // Pattern: || '`} -> || ''}
  {
    pattern: /\|\| '`\}/g,
    replacement: "|| ''}"
  },
  // Pattern: ? 's' : '`} -> ? 's' : ''}
  {
    pattern: /\? 's' : '`\}/g,
    replacement: "? 's' : ''}"
  },
  // Pattern: '_blank`) -> '_blank')
  {
    pattern: /'_blank`\)/g,
    replacement: "'_blank')"
  },
  // Pattern: ?' dans les confirmations
  {
    pattern: /confirm\('([^']*?)`\)/g,
    replacement: "confirm('$1')"
  },
  // Pattern: alt={`text`} avec erreur de fermeture
  {
    pattern: /alt=\{`([^`]*?)`\}/g,
    replacement: 'alt={`$1`}'
  },
  // Pattern: src={book.image_couverture || '`} -> src={book.image_couverture || ''}
  {
    pattern: /src=\{[^}]*?\|\| '`\}/g,
    replacement: (match) => match.replace('`}', "''}")
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    fixes.forEach(fix => {
      const originalContent = content;
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      if (content !== originalContent) {
        hasChanges = true;
      }
    });

    // Corrections spécifiques pour certains patterns complexes

    // Corriger les template literals cassés dans les descriptions
    content = content.replace(
      /description: `([^`]*?)'\s*}/g,
      'description: `$1`}'
    );

    // Corriger les template literals cassés dans les variant
    content = content.replace(
      /variant=\{filterType === 'all' \? 'default' : 'outline`\}/g,
      "variant={filterType === 'all' ? 'default' : 'outline'}"
    );

    if (hasChanges || content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function findTsxFiles(dir) {
  const files = [];

  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
        walkDir(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }

  walkDir(dir);
  return files;
}

// Exécution
const webDir = path.join(__dirname, 'apps', 'web', 'src');
console.log('🔍 Recherche des fichiers TypeScript pour corrections supplémentaires...');

const files = findTsxFiles(webDir);
console.log(`📁 Trouvé ${files.length} fichiers à vérifier`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Terminé! ${fixedCount} fichier(s) corrigé(s) supplémentaire(s)`);