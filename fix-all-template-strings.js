const fs = require('fs');
const path = require('path');

// Fonction pour corriger un fichier
const fixFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern principal : 'quelque chose ${variable} reste'`
    // Doit devenir : `quelque chose ${variable} reste`
    const mainPattern = /'([^']*\$\{[^}]*\}[^']*)`/g;
    const matches = content.match(mainPattern);

    if (matches) {
      console.log(`  🔧 Found ${matches.length} template string errors in ${path.basename(filePath)}`);

      // Remplacer chaque occurrence
      content = content.replace(mainPattern, (match, inner) => {
        return `\`${inner}\``;
      });

      modified = true;
    }

    // Pattern secondaire : apiClient.get('path${var}path`, options)
    const patternWithOptions = /'([^']*\$\{[^}]*\}[^']*)`(\s*,\s*\{)/g;
    if (patternWithOptions.test(content)) {
      content = content.replace(patternWithOptions, (match, inner, rest) => {
        return `\`${inner}\`${rest}`;
      });
      modified = true;
      console.log(`  🔧 Fixed template strings with options in ${path.basename(filePath)}`);
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    } else {
      console.log(`⏭️ No template string issues: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
};

// Scanner récursivement tous les fichiers .ts/.tsx
const scanDirectory = (dir, filesFixed) => {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Ignorer les dossiers système
      if (!item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath, filesFixed);
      }
    } else if ((item.endsWith('.ts') || item.endsWith('.tsx')) && !item.endsWith('.d.ts')) {
      // Vérifier si le fichier contient des template strings mal formés
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (/'[^']*\$\{[^}]*\}[^']*`/.test(content)) {
          console.log(`\n🎯 Processing: ${path.relative(process.cwd(), fullPath)}`);
          if (fixFile(fullPath)) {
            filesFixed.push(fullPath);
          }
        }
      } catch (error) {
        // Ignorer les erreurs de lecture
      }
    }
  });
};

console.log('🛠️ Correction de TOUS les template strings mal formés...');
console.log('📂 Scanning: apps/web/src');
console.log('');

const srcDir = path.join(__dirname, 'apps', 'web', 'src');
const filesFixed = [];

if (fs.existsSync(srcDir)) {
  scanDirectory(srcDir, filesFixed);
} else {
  console.error('❌ Source directory not found:', srcDir);
  process.exit(1);
}

console.log('\n📊 Résumé final:');
console.log(`✅ Fichiers corrigés: ${filesFixed.length}`);

if (filesFixed.length > 0) {
  console.log('\n📋 Fichiers modifiés:');
  filesFixed.forEach(file => {
    console.log(`  - ${path.relative(process.cwd(), file)}`);
  });
}

console.log('\n🎉 Correction terminée !');
console.log('\n📋 Prochaine étape: npm run build');