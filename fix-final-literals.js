const fs = require('fs');
const path = require('path');

// Script final pour corriger les dernières erreurs de template literals

const fixes = [
  // Pattern: 'PDF`) -> 'PDF')
  {
    pattern: /'PDF`\)/g,
    replacement: "'PDF')"
  },
  // Pattern: 'CSV`) -> 'CSV')
  {
    pattern: /'CSV`\)/g,
    replacement: "'CSV')"
  },
  // Pattern: 'JSON`) -> 'JSON')
  {
    pattern: /'JSON`\)/g,
    replacement: "'JSON')"
  },
  // Pattern: 'Enter`) -> 'Enter')
  {
    pattern: /'Enter`\)/g,
    replacement: "'Enter')"
  },
  // Pattern: `${variable}20' -> `${variable}20`
  {
    pattern: /`\$\{([^}]+)\}20'/g,
    replacement: "`${$1}20`"
  },
  // Pattern: dépasser ${maxSize}MB' -> dépasser ${maxSize}MB`
  {
    pattern: /dépasser \$\{maxSize\}MB'/g,
    replacement: "dépasser ${maxSize}MB`"
  },
  // Pattern: collection=${variable}`) -> collection=${variable}`)
  {
    pattern: /collection=\$\{([^}]+)\}`\)/g,
    replacement: "collection=${$1}`)"
  },
  // Pattern: quelconque template literal mal formé
  {
    pattern: /'\$\{([^}]+)\}`/g,
    replacement: "`${$1}`"
  },
  // Pattern: `${variable}' -> `${variable}`
  {
    pattern: /`\$\{([^}]+)\}'/g,
    replacement: "`${$1}`"
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

    // Corrections spécifiques manuelles
    const manualFixes = [
      // Corriger `collection=${list.id}`)} qui devrait être `collection=${list.id}`)
      {
        from: /`\/books\?collection=\$\{list\.id\}`\)\}/g,
        to: "`/books?collection=${list.id}`)"
      },
      // Corriger '${tag.couleur}20' qui devrait être `${tag.couleur}20`
      {
        from: /'?\$\{tag\.couleur\}20'/g,
        to: "`${tag.couleur}20`"
      },
      // Corriger '${maxSize}MB' qui devrait être `${maxSize}MB`
      {
        from: /'L'image ne doit pas dépasser \$\{maxSize\}MB'/g,
        to: "`L'image ne doit pas dépasser ${maxSize}MB`"
      }
    ];

    manualFixes.forEach(fix => {
      const originalContent = content;
      content = content.replace(fix.from, fix.to);
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
console.log('🔍 Correction finale des template literals...');

const files = findTsxFiles(webDir);
console.log(`📁 Trouvé ${files.length} fichiers à vérifier`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Terminé! ${fixedCount} fichier(s) corrigé(s) pour la correction finale`);