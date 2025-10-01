const fs = require('fs');
const path = require('path');

// Corrections pour les backticks mal fermés
const fixes = [
  {
    file: 'apps/web/src/components/admin/books-manager.tsx',
    patterns: [
      { from: /'dd MMM yyyy`,/g, to: "'dd MMM yyyy'," }
    ]
  },
  {
    file: 'apps/web/src/components/admin/categories-manager.tsx',
    patterns: [
      { from: /: '`\}/g, to: ": ''}" }
    ]
  },
  {
    file: 'apps/web/src/components/admin/export-manager.tsx',
    patterns: [
      { from: /'none`;/g, to: "'none';" },
      { from: /'Erreur lors du téléchargement`,/g, to: "'Erreur lors du téléchargement'," }
    ]
  },
  {
    file: 'apps/web/src/components/admin/tags-manager.tsx',
    patterns: [
      { from: /'Marquer favori`\}/g, to: "'Marquer favori'}" }
    ]
  },
  {
    file: 'apps/web/src/components/auth/LoadingSpinner.tsx',
    patterns: [
      { from: /'h-8 w-8`,/g, to: "'h-8 w-8'," }
    ]
  }
];

console.log('🔧 Correction finale des backticks mal fermés...');
console.log('');

let totalFixed = 0;

fixes.forEach(({ file, patterns }) => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    patterns.forEach(({ from, to }) => {
      if (from.test(content)) {
        console.log(`  🔧 Fixing backtick in ${path.basename(file)}`);
        content = content.replace(from, to);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
      totalFixed++;
    } else {
      console.log(`⏭️ No backtick issues: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }

  console.log('');
});

console.log('📊 Résultats finaux:');
console.log(`✅ Fichiers corrigés: ${totalFixed}`);
console.log('');
console.log('🎉 MIGRATION COMPLÈTE TERMINÉE !');
console.log('');
console.log('🚀 Commandes suivantes:');
console.log('1. npm run build (vérification finale)');
console.log('2. bun run dev:stable (lancer en développement)');

// Scanner pour d'autres backticks problématiques dans tout le projet
console.log('');
console.log('🔍 Scan pour autres backticks problématiques...');

const scanDir = path.join(__dirname, 'apps/web/src');
const problematicFiles = [];

function scanForBackticks(dir) {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      scanForBackticks(fullPath);
    } else if ((item.endsWith('.ts') || item.endsWith('.tsx')) && !item.endsWith('.d.ts')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Pattern pour détecter les backticks mal fermés
        if (/['"]\w*`|\w*`['"]/g.test(content)) {
          const relativePath = path.relative(__dirname, fullPath);
          problematicFiles.push(relativePath);
        }
      } catch (error) {
        // Ignorer les erreurs de lecture
      }
    }
  });
}

if (fs.existsSync(scanDir)) {
  scanForBackticks(scanDir);

  if (problematicFiles.length > 0) {
    console.log(`⚠️ Fichiers avec potentiels problèmes de backticks: ${problematicFiles.length}`);
    problematicFiles.slice(0, 10).forEach(file => {
      console.log(`   - ${file}`);
    });
    if (problematicFiles.length > 10) {
      console.log(`   ... et ${problematicFiles.length - 10} autres`);
    }
  } else {
    console.log('✅ Aucun backtick problématique détecté !');
  }
}