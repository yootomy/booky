const fs = require('fs');
const path = require('path');

// Corrections spécifiques pour les hooks migrés
const fixes = [
  // Corriger les appels apiClient mal convertis
  {
    pattern: /apiClient\.get\('([^']+)',\s*\{\s*credentials:\s*'include'\s*\}\)/g,
    replacement: "apiClient.get('$1')"
  },
  {
    pattern: /apiClient\.get\('([^']+)',\s*\{\s*method:\s*'POST',([^}]+)\}\)/g,
    replacement: "apiClient.post('$1',$2)"
  },
  {
    pattern: /apiClient\.get\('([^']+)',\s*\{\s*method:\s*'PUT',([^}]+)\}\)/g,
    replacement: "apiClient.put('$1',$2)"
  },
  {
    pattern: /apiClient\.get\('([^']+)',\s*\{\s*method:\s*'DELETE',([^}]+)\}\)/g,
    replacement: "apiClient.delete('$1',$2)"
  },
  {
    pattern: /apiClient\.get\('([^']+)',\s*\{\s*method:\s*'PATCH',([^}]+)\}\)/g,
    replacement: "apiClient.patch('$1',$2)"
  },
  // Corriger les appels .then(r => r.json())
  {
    pattern: /apiClient\.get\('([^']+)'\)\.then\(r\s*=>\s*r\.json\(\)\)/g,
    replacement: "apiClient.get('$1').then(r => r.data)"
  },
  // Corriger les .ok checks
  {
    pattern: /if\s*\(\s*!response\.ok\s*\)/g,
    replacement: "if (!response.success)"
  },
  {
    pattern: /const\s+data\s*=\s*await\s+response\.json\(\)/g,
    replacement: "const data = response.data"
  },
  // Corriger les interpolations de template strings cassées
  {
    pattern: /apiClient\.get\('([^']+)\$\{([^}]+)\}([^']+)'\)/g,
    replacement: "apiClient.get(`$1\${$2}$3`)"
  },
  {
    pattern: /apiClient\.delete\('([^']+)\$\{([^}]+)\}([^']+)'\)/g,
    replacement: "apiClient.delete(`$1\${$2}$3`)"
  },
];

// Fonction pour corriger un fichier spécifique
const fixFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Appliquer toutes les corrections
    fixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        const before = content.match(pattern);
        content = content.replace(pattern, replacement);
        if (before) {
          console.log(`  🔧 Fixed pattern: ${before[0].substring(0, 50)}...`);
          modified = true;
        }
      }
    });

    // Corrections spéciales pour les favoris
    if (filePath.includes('useFavorites') || filePath.includes('Favorites')) {
      // Fix specific favorites issues
      content = content.replace(
        /const response = await apiClient\.get\('\/api\/favorites',\s*\{\s*method:\s*'POST',.*?\}\);/gs,
        'const response = await apiClient.post(\'/api/favorites\', { bookId });'
      );

      content = content.replace(
        /const response = await apiClient\.get\('\/api\/favorites\/\$\{bookId\}',\s*\{\s*method:\s*'DELETE',.*?\}\);/gs,
        'const response = await apiClient.delete(`/api/favorites/${bookId}`);'
      );

      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    } else {
      console.log(`⏭️ No fixes needed: ${path.relative(process.cwd(), filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
};

// Fichiers à corriger prioritairement
const criticalFiles = [
  'apps/web/src/hooks/useFavorites.ts',
  'apps/web/src/hooks/useFavorites-OLD.ts',
  'apps/web/src/hooks/use-home-data.ts',
  'apps/web/src/hooks/use-home-data-OLD.ts'
];

console.log('🛠️ Correction des problèmes de migration...');
console.log('');

let fixedCount = 0;

// Corriger les fichiers critiques d'abord
criticalFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`🎯 Correction prioritaire: ${file}`);
    if (fixFile(fullPath)) {
      fixedCount++;
    }
    console.log('');
  }
});

console.log('📊 Résumé des corrections:');
console.log(`✅ Fichiers corrigés: ${fixedCount}`);
console.log('');
console.log('🎉 Corrections terminées !');

console.log('');
console.log('📋 Vérifications recommandées:');
console.log('1. Compiler: npm run build');
console.log('2. Tester les favoris');
console.log('3. Tester la page d\'accueil');
console.log('4. Vérifier les logs de la console');