const fs = require('fs');
const path = require('path');

// Répertoire source
const srcDir = path.join(__dirname, 'apps', 'web', 'src');

// Patterns de remplacement
const replacements = [
  // Remplacer les appels fetch vers /api/proxy
  {
    pattern: /fetch\s*\(\s*['"`]\/api\/proxy\//g,
    replacement: "apiClient.get('/api/"
  },
  {
    pattern: /fetch\s*\(\s*['"`]\/api\/proxy\/([^'"`]+)['"`]\s*\)/g,
    replacement: "apiClient.get('/api/$1')"
  },
  {
    pattern: /fetch\s*\(\s*['"`]\/api\/proxy\/([^'"`]+)['"`]\s*,\s*\{\s*method:\s*['"`]GET['"`]/g,
    replacement: "apiClient.get('/api/$1'"
  },
  {
    pattern: /fetch\s*\(\s*['"`]\/api\/proxy\/([^'"`]+)['"`]\s*,\s*\{\s*method:\s*['"`]POST['"`]/g,
    replacement: "apiClient.post('/api/$1'"
  },
  {
    pattern: /fetch\s*\(\s*['"`]\/api\/proxy\/([^'"`]+)['"`]\s*,\s*\{\s*method:\s*['"`]PUT['"`]/g,
    replacement: "apiClient.put('/api/$1'"
  },
  {
    pattern: /fetch\s*\(\s*['"`]\/api\/proxy\/([^'"`]+)['"`]\s*,\s*\{\s*method:\s*['"`]PATCH['"`]/g,
    replacement: "apiClient.patch('/api/$1'"
  },
  {
    pattern: /fetch\s*\(\s*['"`]\/api\/proxy\/([^'"`]+)['"`]\s*,\s*\{\s*method:\s*['"`]DELETE['"`]/g,
    replacement: "apiClient.delete('/api/$1'"
  }
];

// Ajouter l'import du client API si nécessaire
const addApiClientImport = (content, filePath) => {
  // Skip si déjà présent
  if (content.includes("from '@/lib/api-client'") || content.includes("import { apiClient }")) {
    return content;
  }

  // Skip si pas de modifications proxy
  if (!content.includes('api/proxy') && !content.includes('apiClient')) {
    return content;
  }

  // Trouver où insérer l'import
  const lines = content.split('\n');
  let insertIndex = -1;

  // Chercher après les imports React/Next
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import') && (line.includes('react') || line.includes('next'))) {
      insertIndex = i + 1;
    }
    if (line === '' && insertIndex !== -1) {
      break;
    }
  }

  // Si pas trouvé, insérer après le dernier import
  if (insertIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import')) {
        insertIndex = i + 1;
      }
    }
  }

  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, "import { apiClient } from '@/lib/api-client';");
    return lines.join('\n');
  }

  return content;
};

// Fonction pour traiter un fichier
const processFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Appliquer les remplacements
    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Ajouter l'import si nécessaire
    if (modified || content.includes('apiClient')) {
      const newContent = addApiClientImport(content, filePath);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }

    // Écrire le fichier modifié
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Migrated: ${path.relative(srcDir, filePath)}`);
      return true;
    } else {
      console.log(`⏭️ Skipped: ${path.relative(srcDir, filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
};

// Fonction pour scanner récursivement les fichiers
const scanDirectory = (dir) => {
  let migratedFiles = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Ignorer node_modules et .next
      if (!item.startsWith('.') && item !== 'node_modules') {
        migratedFiles.push(...scanDirectory(fullPath));
      }
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      // Traiter les fichiers TypeScript/React
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('/api/proxy/')) {
        if (processFile(fullPath)) {
          migratedFiles.push(fullPath);
        }
      }
    }
  });

  return migratedFiles;
};

// Exécuter la migration
console.log('🚀 Migration des appels proxy vers apiClient...');
console.log(`📂 Répertoire source: ${srcDir}`);
console.log('');

const migratedFiles = scanDirectory(srcDir);

console.log('');
console.log('📊 Résumé de la migration:');
console.log(`✅ Fichiers migrés: ${migratedFiles.length}`);
console.log('');

if (migratedFiles.length > 0) {
  console.log('📋 Fichiers modifiés:');
  migratedFiles.forEach(file => {
    console.log(`  - ${path.relative(srcDir, file)}`);
  });
  console.log('');
}

console.log('🎉 Migration terminée !');
console.log('');
console.log('⚠️ Actions manuelles nécessaires:');
console.log('1. Vérifier la compilation: npm run build');
console.log('2. Tester les fonctionnalités migrées');
console.log('3. Supprimer le dossier proxy une fois validé');