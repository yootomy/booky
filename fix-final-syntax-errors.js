const fs = require('fs');
const path = require('path');

// Corrections spécifiques pour les dernières erreurs
const specificFixes = [
  {
    file: 'apps/web/src/components/admin/books-manager.tsx',
    fixes: [
      {
        pattern: /src=\{book\.image_couverture \|\| '`\}/g,
        replacement: "src={book.image_couverture || ''}"
      }
    ]
  },
  {
    file: 'apps/web/src/components/admin/categories-manager.tsx',
    fixes: [
      {
        pattern: /\{editingCategory \? 'Sauvegarder' : 'Créer`\}/g,
        replacement: "{editingCategory ? 'Sauvegarder' : 'Créer'}"
      }
    ]
  },
  {
    file: 'apps/web/src/components/admin/export-manager.tsx',
    fixes: [
      {
        pattern: /format: 'PDF`,/g,
        replacement: "format: 'PDF',"
      }
    ]
  },
  {
    file: 'apps/web/src/components/admin/lists-manager.tsx',
    fixes: [
      {
        pattern: /boxShadow: '0 8px 32px rgba\(139, 21, 56, 0\.08\)`/g,
        replacement: "boxShadow: '0 8px 32px rgba(139, 21, 56, 0.08)'"
      },
      {
        pattern: /color: '#2C1810`/g,
        replacement: "color: '#2C1810'"
      },
      {
        pattern: /backgroundColor: 'rgba\(139, 21, 56, 0\.05\)`/g,
        replacement: "backgroundColor: 'rgba(139, 21, 56, 0.05)'"
      }
    ]
  },
  {
    file: 'apps/web/src/components/admin/tags-manager.tsx',
    fixes: [
      {
        pattern: /\{editingTag \? 'Sauvegarder' : 'Créer`\}/g,
        replacement: "{editingTag ? 'Sauvegarder' : 'Créer'}"
      }
    ]
  }
];

// Fonction pour corriger un fichier
const fixFile = (fileConfig) => {
  const filePath = path.join(__dirname, fileConfig.file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${fileConfig.file}`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fileConfig.fixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        console.log(`  🔧 Fixing pattern in ${path.basename(filePath)}`);
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${fileConfig.file}`);
      return true;
    } else {
      console.log(`⏭️ No fixes needed: ${fileConfig.file}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
};

console.log('🛠️ Correction des dernières erreurs de syntaxe...');
console.log('');

let fixedCount = 0;

specificFixes.forEach(fileConfig => {
  console.log(`🎯 Processing: ${fileConfig.file}`);
  if (fixFile(fileConfig)) {
    fixedCount++;
  }
  console.log('');
});

console.log('📊 Résumé final:');
console.log(`✅ Fichiers corrigés: ${fixedCount}`);
console.log('');
console.log('🎉 Toutes les corrections terminées !');
console.log('');
console.log('📋 Prochaines étapes:');
console.log('1. npm run build (pour vérifier la compilation)');
console.log('2. bun run dev:stable (pour tester en dev)');
console.log('3. Supprimer le dossier proxy une fois validé');