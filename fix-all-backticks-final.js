const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Trouver tous les fichiers .ts et .tsx
const files = glob.sync('apps/web/src/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
});

let totalFixed = 0;
let filesModified = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let modified = content;
  let fixCount = 0;

  // Pattern 1: Backticks utilisés comme quotes simples (pas de ${})
  // Remplacer `text` par 'text' SEULEMENT si pas de ${}
  modified = modified.replace(/`([^`$]*)`/g, (match, inner) => {
    // Si contient ${}, c'est un vrai template literal, on garde
    if (inner.includes('${')) {
      return match;
    }
    // Sinon, remplacer par single quote
    fixCount++;
    return `'${inner}'`;
  });

  // Pattern 2: Backticks isolés (erreurs de frappe)
  // 'text` -> 'text'
  modified = modified.replace(/('(?:[^'\\]|\\.)*)`/g, (match) => {
    fixCount++;
    return match.slice(0, -1) + "'";
  });

  // Pattern 3: `text' -> 'text'
  modified = modified.replace(/`((?:[^`\\]|\\.)*?)'/g, (match, inner) => {
    if (inner.includes('${')) {
      return match;
    }
    fixCount++;
    return `'${inner}'`;
  });

  // Pattern 4: "text` -> "text"
  modified = modified.replace(/"((?:[^"\\]|\\.)*?)`/g, '"$1"');

  // Pattern 5: `text" -> "text"
  modified = modified.replace(/`((?:[^`\\]|\\.)*?)"/g, (match, inner) => {
    if (inner.includes('${')) {
      return match;
    }
    fixCount++;
    return `"${inner}"`;
  });

  if (modified !== content) {
    fs.writeFileSync(file, modified, 'utf8');
    filesModified++;
    totalFixed += fixCount;
    console.log(`✓ ${file}: ${fixCount} backticks corrigés`);
  }
});

console.log(`\n✅ TERMINÉ: ${totalFixed} backticks corrigés dans ${filesModified} fichiers`);
