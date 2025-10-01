const fs = require('fs');
const path = require('path');

// Fonction pour corriger tous les problèmes de quotes dans un fichier
const fixAllQuotes = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Corriger les chaînes mixées avec backticks à la fin
    content = content.replace(/'([^'`]*)`/g, "'$1'");
    content = content.replace(/"([^"`]*)` /g, '"$1" ');
    content = content.replace(/`([^'"`]*)`([^'])/g, "'$1'$2");

    // 2. Corriger les Content-Type et autres chaînes communes
    content = content.replace(/'Content-Type': 'application\/json`,/g, "'Content-Type': 'application/json',");
    content = content.replace(/'GET`,/g, "'GET',");
    content = content.replace(/'POST`,/g, "'POST',");
    content = content.replace(/'PUT`,/g, "'PUT',");
    content = content.replace(/'PATCH`,/g, "'PATCH',");
    content = content.replace(/'DELETE`,/g, "'DELETE',");

    // 3. Corriger les guillemets dans les messages d'erreur et strings communes
    content = content.replace(/: '([^'`]*)`/g, ": '$1'");
    content = content.replace(/= '([^'`]*)`/g, "= '$1'");
    content = content.replace(/\('([^'`]*)`\)/g, "('$1')");

    // 4. Corriger les template strings partiellement malformés
    content = content.replace(/'([^']*\$\{[^}]*\}[^']*)`/g, "`$1`");

    // 5. Corriger les cookies et headers
    content = content.replace(/'; `\}/g, "'; }");
    content = content.replace(/` }/g, "' }");
    content = content.replace(/`,$/g, "',");

    // 6. Corriger les styles CSS
    content = content.replace(/'([^']*)`$/gm, "'$1'");
    content = content.replace(/'([^']*)`\s*\}/g, "'$1' }");

    // 7. Corriger les cas spéciaux dans JSX
    content = content.replace(/="([^"]*)`"/g, '="$1"');
    content = content.replace(/\{([^}]*)`\}/g, '{$1}');

    // 8. Nettoyer les doubles corrections accidentelles
    content = content.replace(/''/g, "''");
    content = content.replace(/`'/g, "'");
    content = content.replace(/'`/g, "'");

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
};

// Fonction pour scanner récursivement
const scanAndFix = (dir, fixedFiles = []) => {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules') {
        scanAndFix(fullPath, fixedFiles);
      }
    } else if ((item.endsWith('.ts') || item.endsWith('.tsx')) && !item.endsWith('.d.ts')) {
      if (fixAllQuotes(fullPath)) {
        fixedFiles.push(path.relative(process.cwd(), fullPath));
      }
    }
  });

  return fixedFiles;
};

console.log('🛠️ CORRECTION GLOBALE DE TOUS LES PROBLÈMES DE QUOTES...');
console.log('📂 Scan: apps/web/src');
console.log('');

const srcDir = path.join(__dirname, 'apps', 'web', 'src');
const fixedFiles = scanAndFix(srcDir);

console.log('📊 RÉSULTATS FINAUX:');
console.log(`✅ Fichiers corrigés: ${fixedFiles.length}`);

if (fixedFiles.length > 0) {
  console.log('');
  console.log('📋 Échantillon des fichiers modifiés:');
  fixedFiles.slice(0, 10).forEach(file => {
    console.log(`  ✅ ${file}`);
  });
  if (fixedFiles.length > 10) {
    console.log(`  ... et ${fixedFiles.length - 10} autres fichiers`);
  }
}

console.log('');
console.log('🎉 CORRECTION COMPLÈTE TERMINÉE !');
console.log('');
console.log('🚀 PROCHAINES ÉTAPES:');
console.log('1. npm run build (vérification finale)');
console.log('2. bun run dev:stable (test complet)');
console.log('3. Supprimer le dossier proxy si tout fonctionne');