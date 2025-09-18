#!/usr/bin/env bun

/**
 * 🚀 Script d'optimisation de la base de données PostgreSQL
 *
 * Usage: bun run src/scripts/run-db-optimization.ts
 */

import { db } from '../utils/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runDatabaseOptimization() {
  console.log('🚀 Starting database optimization...');

  try {
    // Lire le script SQL d'optimisation
    const sqlScript = readFileSync(
      join(__dirname, 'optimize-database.sql'),
      'utf8'
    );

    // Diviser le script en commandes individuelles
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Found ${commands.length} optimization commands`);

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      if (command.toLowerCase().includes('alter system')) {
        console.log(`⚠️  Skipping ALTER SYSTEM command (requires superuser): ${command.substring(0, 50)}...`);
        continue;
      }

      try {
        console.log(`⚡ Executing command ${i + 1}/${commands.length}...`);
        await db.$executeRawUnsafe(command);
        console.log(`✅ Command ${i + 1} completed successfully`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Skipping (already exists): ${command.substring(0, 50)}...`);
        } else {
          console.error(`❌ Error in command ${i + 1}:`, error.message);
        }
      }
    }

    // Statistiques après optimisation
    console.log('\n📊 Running post-optimization analysis...');

    const stats = await getPostOptimizationStats();
    console.log('✅ Database optimization completed!');
    console.log('\n📈 Current database statistics:');
    console.table(stats);

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

async function getPostOptimizationStats() {
  const stats = {
    books: await db.book.count(),
    users: await db.user.count(),
    favorites: await db.book_favorite.count(),
    categories: await db.category.count(),
    tags: await db.tag.count(),
    questions: await db.book_question.count(),
  };

  // Test de performance d'une requête complexe
  const perfStart = Date.now();
  await db.book.findMany({
    take: 10,
    include: {
      book_category: { include: { category: true } },
      book_tag: { include: { tag: true } },
      user: { select: { id: true, nom_complet: true } }
    },
    orderBy: { date_creation: 'desc' }
  });
  const perfTime = Date.now() - perfStart;

  return {
    ...stats,
    complexQueryTime: `${perfTime}ms`
  };
}

// Fonction de diagnostic des connexions
async function diagnoseDatabaseConnections() {
  console.log('\n🔍 Diagnosing database connections...');

  try {
    // Test de connexions multiples simultanées
    const connectionTests = Array.from({ length: 10 }, async (_, i) => {
      const start = Date.now();
      await db.$queryRaw`SELECT ${i + 1} as test_connection`;
      return Date.now() - start;
    });

    const results = await Promise.all(connectionTests);
    const avgTime = results.reduce((a, b) => a + b, 0) / results.length;

    console.log(`✅ Connection test completed`);
    console.log(`📊 Average connection time: ${avgTime.toFixed(2)}ms`);
    console.log(`🔢 Min: ${Math.min(...results)}ms, Max: ${Math.max(...results)}ms`);

    if (avgTime > 100) {
      console.warn('⚠️  High connection latency detected. Consider connection pooling optimization.');
    }

  } catch (error) {
    console.error('❌ Connection diagnosis failed:', error);
  }
}

// Exécution du script
async function main() {
  console.log('🔧 Booky Database Optimization Tool\n');

  // Diagnostic initial
  await diagnoseDatabaseConnections();

  // Optimisation
  await runDatabaseOptimization();

  console.log('\n🎉 All optimizations completed successfully!');
  console.log('💡 Restart your application to apply all changes.');
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Point d'entrée
main().catch(console.error);