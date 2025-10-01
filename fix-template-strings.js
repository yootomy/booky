const fs = require('fs');
const path = require('path');

// Corrections pour les template strings cassés
const fixes = [
  {
    pattern: /apiClient\.get\('([^']*)\$\{([^}]+)\}([^']*)'(?:,|\s*\)`)/g,
    replacement: "apiClient.get(`$1\${$2}$3`"
  },
  {
    pattern: /apiClient\.get\('([^']*)\$\{([^}]+)\}([^']*)`\s*,\s*\{/g,
    replacement: "apiClient.get(`$1\${$2}$3`, {"
  },
  {
    pattern: /apiClient\.get\('([^']*)\$\{([^}]+)\}([^']*)`\s*\)/g,
    replacement: "apiClient.get(`$1\${$2}$3`)"
  },
];

// Fichiers avec erreurs de compilation
const filesToFix = [
  'apps/web/src/components/admin/lists-manager.tsx',
  'apps/web/src/components/admin/questions-manager.tsx',
  'apps/web/src/components/forms/list-form.tsx',
  'apps/web/src/hooks/use-search-suggestions.ts',
  'apps/web/src/app/admin/conseils/page.tsx'
];

const fixFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix template strings
    fixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        console.log(`  🔧 Fixing template string in ${path.basename(filePath)}`);
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Corrections spécifiques fichier par fichier
    if (filePath.includes('lists-manager.tsx')) {
      content = content.replace(
        /apiClient\.get\('\/api\/lists\?\$\{params\.toString\(\)\}`\)/g,
        "apiClient.get(`/api/lists?${params.toString()}`)"
      );
      modified = true;
    }

    if (filePath.includes('questions-manager.tsx')) {
      content = content.replace(
        /apiClient\.get\('\/api\/books\/\$\{bookId\}\/questions\/\$\{questionId\}`, \{[^}]+\}\)/gs,
        "apiClient.put(`/api/books/${bookId}/questions/${questionId}`, updateData)"
      );
      modified = true;
    }

    if (filePath.includes('list-form.tsx')) {
      content = content.replace(
        /apiClient\.get\('\/api\/lists\/\$\{initialData\.id\}\/books`\)/g,
        "apiClient.get(`/api/lists/${initialData.id}/books`)"
      );
      modified = true;
    }

    if (filePath.includes('use-search-suggestions.ts')) {
      content = content.replace(
        /apiClient\.get\('\/api\/search\/suggest\?q=\$\{encodeURIComponent\(query\)\}&limit=\$\{maxSuggestions\}`,([^}]+\})/gs,
        "apiClient.get(`/api/search/suggest?q=${encodeURIComponent(query)}&limit=${maxSuggestions}`$1"
      );
      modified = true;
    }

    if (filePath.includes('conseils/page.tsx')) {
      content = content.replace(
        /apiClient\.get\('\/api\/conseil-requests\/\$\{id\}`, \{[^}]+\}\)/gs,
        "apiClient.patch(`/api/conseil-requests/${id}`, { reponse_bruna, livres_recommandes, status })"
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

console.log('🛠️ Correction des erreurs de template strings...');
console.log('');

let fixedCount = 0;

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`🎯 Correction: ${file}`);
    if (fixFile(fullPath)) {
      fixedCount++;
    }
    console.log('');
  } else {
    console.log(`❌ File not found: ${file}`);
  }
});

console.log('📊 Résumé des corrections:');
console.log(`✅ Fichiers corrigés: ${fixedCount}`);
console.log('🎉 Corrections terminées !');