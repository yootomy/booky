const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Pattern pour trouver tous les fichiers proxy
const proxyFiles = glob.sync('apps/web/src/app/api/proxy/**/*.ts');

console.log(`Found ${proxyFiles.length} proxy files to update`);

proxyFiles.forEach(filePath => {
  try {
    const fullPath = path.resolve(filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Ajouter l'import si pas déjà présent
    if (!content.includes("import { getServerUrl } from '@/utils/server-url';")) {
      if (content.includes("import { NextRequest, NextResponse } from 'next/server';")) {
        content = content.replace(
          "import { NextRequest, NextResponse } from 'next/server';",
          "import { NextRequest, NextResponse } from 'next/server';\nimport { getServerUrl } from '@/utils/server-url';"
        );
        modified = true;
      }
    }

    // Remplacer toutes les instances de localhost hardcodé
    const patterns = [
      /process\.env\.SERVER_URL \|\| 'http:\/\/localhost:3000'/g,
      /process\.env\.NEXT_PUBLIC_SERVER_URL \|\| process\.env\.SERVER_URL \|\| 'http:\/\/localhost:3000'/g,
      /process\.env\.NEXT_PUBLIC_SERVER_URL \|\| 'http:\/\/localhost:3004'/g,
      /'http:\/\/localhost:3000'/g
    ];

    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, 'getServerUrl()');
        modified = true;
      }
    });

    // Cas spéciaux avec variables
    if (content.includes('const serverUrl = ')) {
      content = content.replace(/const serverUrl = process\.env\..*?;/g, 'const serverUrl = getServerUrl();');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log('🎉 All proxy files updated!');