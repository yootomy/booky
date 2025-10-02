const fs = require('fs');
const path = require('path');

// Script pour corriger UNIQUEMENT les erreurs de template literals
// Patterns spécifiques trouvés dans les erreurs TypeScript

const fixes = [
  // Pattern: 'text`, -> 'text',
  {
    pattern: /'([^']*?)`,/g,
    replacement: "'$1',"
  },
  // Pattern: `text') -> `text`)
  {
    pattern: /`([^`]*?)'\)/g,
    replacement: "`$1`)"
  },
  // Pattern: `text'} -> `text`}
  {
    pattern: /`([^`]*?)'\}/g,
    replacement: "`$1`}"
  },
  // Pattern: {'text'} -> {`text`} (quand c'est un template literal)
  {
    pattern: /\{'([^']*?\$\{[^}]*\}[^']*?)'\}/g,
    replacement: "{`$1`}"
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    fixes.forEach(fix => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        hasChanges = true;
      }
    });

    if (hasChanges) {
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
console.log('🔍 Recherche des fichiers TypeScript...');

const files = findTsxFiles(webDir);
console.log(`📁 Trouvé ${files.length} fichiers à vérifier`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Terminé! ${fixedCount} fichier(s) corrigé(s)`);