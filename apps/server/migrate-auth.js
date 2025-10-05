#!/usr/bin/env node
/**
 * Script de migration automatique de getTypedSession vers withBetterAuth
 *
 * Ce script :
 * 1. Remplace les imports de getTypedSession par withBetterAuth
 * 2. Transforme le code d'authentification pour utiliser le middleware
 * 3. Garde le même niveau de sécurité
 */

const fs = require('fs');
const path = require('path');

const filesToMigrate = [
  './src/app/api/books/[id]/categories/[categoryId]/route.ts',
  './src/app/api/books/[id]/categories/route.ts',
  './src/app/api/books/[id]/tags/[tagId]/route.ts',
  './src/app/api/books/[id]/tags/route.ts',
  './src/app/api/categories/[id]/books/route.ts',
  './src/app/api/categories/[id]/route.ts',
  './src/app/api/categories/[id]/stats/route.ts',
  './src/app/api/categories/route.ts',
  './src/app/api/categories/stats/route.ts',
  './src/app/api/dashboard/current-reading/route.ts',
  './src/app/api/dashboard/recent-books/route.ts',
  './src/app/api/dashboard/top-rated/route.ts',
  './src/app/api/dashboard/wishlist/route.ts',
  './src/app/api/export/books.csv/route.ts',
  './src/app/api/export/books.json/route.ts',
  './src/app/api/export/books.pdf/route.ts',
  './src/app/api/export/config/route.ts',
  './src/app/api/stats/general/route.ts',
  './src/app/api/stats/genres/route.ts',
  './src/app/api/stats/ratings/route.ts',
  './src/app/api/stats/reading/route.ts',
  './src/app/api/stats/spicy-dark-levels/route.ts',
  './src/app/api/tags/[id]/books/route.ts',
  './src/app/api/tags/[id]/route.ts',
  './src/app/api/tags/route.ts',
  './src/app/api/tags/stats/route.ts',
  './src/app/api/upload/covers/route.ts'
];

let successCount = 0;
let errorCount = 0;

console.log('🚀 Début de la migration d\'authentification\n');

filesToMigrate.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier introuvable : ${filePath}`);
    errorCount++;
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // 1. Remplacer l'import de getTypedSession par withBetterAuth
    content = content.replace(
      /import\s*{\s*getTypedSession\s*}\s*from\s*["']@\/utils\/auth-helpers["'];?/g,
      `import { withBetterAuth } from "@/middlewares/auth-improved";`
    );

    // 2. Remplacer le pattern d'auth manuel dans les exports
    // Pattern: export const GET = withErrorHandler(async (request: NextRequest) => {
    //            const user = await getTypedSession(request);
    //            if (!user?.id) { return error... }

    // Cas 1: Avec withErrorHandler
    content = content.replace(
      /export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*withErrorHandler\(async\s*\(request:\s*NextRequest\)\s*=>\s*{[\s\S]*?const\s+user\s*=\s*await\s+getTypedSession\(request\);[\s\S]*?if\s*\(!user\?\?\.id\)\s*{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?401[\s\S]*?\);[\s\S]*?}[\s\S]*?const\s+userId\s*=\s*user\?\?\.id;/g,
      (match, method) => {
        return `export const ${method} = async (request: NextRequest) => {\n  return withBetterAuth(request, async (req, user) => {\n    const userId = user.id;`;
      }
    );

    // Cas 2: Sans withErrorHandler
    content = content.replace(
      /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\(request:\s*NextRequest[^)]*\)\s*{[\s\S]*?const\s+user\s*=\s*await\s+getTypedSession\(request\);[\s\S]*?if\s*\(!user\?\?\.id\)\s*{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?401[\s\S]*?\);[\s\S]*?}[\s\S]*?const\s+userId\s*=\s*user\?\?\.id;/g,
      (match, method) => {
        return `export async function ${method}(request: NextRequest) {\n  return withBetterAuth(request, async (req, user) => {\n    const userId = user.id;`;
      }
    );

    // 3. Changer les références de 'request' par 'req' dans le corps de la fonction
    // (car withBetterAuth passe 'req' comme premier paramètre)

    // 4. Fermer le wrapper withBetterAuth à la fin
    // Trouver le dernier '});' et ajouter un niveau
    const lastClosingBrace = content.lastIndexOf('});');
    if (lastClosingBrace !== -1 && content !== originalContent) {
      content = content.substring(0, lastClosingBrace + 3) + '\n}' + content.substring(lastClosingBrace + 3);
    }

    // Sauvegarder seulement si changements
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Migré : ${filePath}`);
      successCount++;
    } else {
      console.log(`⏭️  Déjà à jour : ${filePath}`);
    }

  } catch (error) {
    console.log(`❌ Erreur : ${filePath}`);
    console.error(`   ${error.message}`);
    errorCount++;
  }
});

console.log(`\n📊 Résultat de la migration :`);
console.log(`   ✅ Succès : ${successCount}`);
console.log(`   ❌ Erreurs : ${errorCount}`);
console.log(`   📁 Total : ${filesToMigrate.length}`);

if (successCount > 0) {
  console.log(`\n⚠️  IMPORTANT : Vérifiez manuellement les fichiers migrés !`);
  console.log(`   Les transformations regex peuvent nécessiter des ajustements.`);
}
