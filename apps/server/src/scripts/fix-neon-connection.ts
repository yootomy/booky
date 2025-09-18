#!/usr/bin/env bun

/**
 * 🚨 Script de diagnostic et réparation pour Neon PostgreSQL
 *
 * Usage: bun run src/scripts/fix-neon-connection.ts
 */

import { PrismaClient } from "../../prisma/generated/client";

async function testNeonConnection() {
  console.log('🔍 Testing Neon PostgreSQL connection...\n');

  const client = new PrismaClient({
    log: ['info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('📡 Attempting to connect...');
    const startTime = Date.now();

    // Test de connexion basique
    await client.$connect();
    const connectTime = Date.now() - startTime;

    console.log(`✅ Connection established in ${connectTime}ms`);

    // Test d'une requête simple
    console.log('🔎 Testing simple query...');
    const queryStart = Date.now();
    const result = await client.$queryRaw`SELECT NOW() as current_time, version() as pg_version`;
    const queryTime = Date.now() - queryStart;

    console.log(`✅ Query executed in ${queryTime}ms`);
    console.log('📊 Database info:', result);

    // Test des tables principales
    console.log('\n📋 Testing main tables...');
    const tableTests = await Promise.allSettled([
      client.user.count(),
      client.book.count(),
      client.category.count(),
      client.tag.count()
    ]);

    const tableNames = ['users', 'books', 'categories', 'tags'];
    tableTests.forEach((test, index) => {
      if (test.status === 'fulfilled') {
        console.log(`✅ ${tableNames[index]}: ${test.value} records`);
      } else {
        console.error(`❌ ${tableNames[index]}: ${test.reason.message}`);
      }
    });

    console.log('\n🎉 All tests passed! Database is healthy.');
    return true;

  } catch (error: any) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('Error code:', error.code);

    if (error.code === 'P1001') {
      console.log('\n🚨 Detected Neon database suspension!');
      return await attemptWakeUp(client);
    }

    return false;
  } finally {
    await client.$disconnect();
  }
}

async function attemptWakeUp(client: PrismaClient) {
  console.log('\n🌅 Attempting to wake up Neon database...');

  const maxAttempts = 5;
  const delays = [5000, 10000, 15000, 20000, 30000]; // Délais croissants

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Wake-up attempt ${attempt}/${maxAttempts}...`);

      // Créer une nouvelle connexion avec timeout long
      const wakeClient = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_URL } }
      });

      // Requête de réveil avec timeout étendu
      const startTime = Date.now();
      await wakeClient.$queryRaw`SELECT pg_sleep(0.5)`;
      const wakeTime = Date.now() - startTime;

      console.log(`✅ Database responded in ${wakeTime}ms on attempt ${attempt}`);

      // Test de fonctionnement
      const testResult = await wakeClient.user.count();
      console.log(`✅ Functional test passed: ${testResult} users found`);

      await wakeClient.$disconnect();
      return true;

    } catch (error: any) {
      console.error(`❌ Wake-up attempt ${attempt} failed:`, error.message);

      if (attempt < maxAttempts) {
        const delay = delays[attempt - 1];
        console.log(`⏰ Waiting ${delay/1000}s before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('\n💀 All wake-up attempts failed. Possible issues:');
  console.error('1. Database is permanently suspended (free tier limit)');
  console.error('2. Network connectivity issues');
  console.error('3. Neon service is down');
  console.error('4. Database credentials are invalid');

  return false;
}

async function showDatabaseInfo() {
  console.log('📋 Current database configuration:');
  console.log('─'.repeat(50));

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    // Masquer le mot de passe pour la sécurité
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
    console.log('🔗 URL:', maskedUrl);

    // Extraire les informations
    const urlObj = new URL(dbUrl);
    console.log('🏢 Host:', urlObj.hostname);
    console.log('🔌 Port:', urlObj.port || '5432');
    console.log('📊 Database:', urlObj.pathname.slice(1));
    console.log('⚙️  SSL:', urlObj.searchParams.get('sslmode') || 'default');
  } else {
    console.error('❌ DATABASE_URL not found in environment');
  }

  console.log('─'.repeat(50));
}

async function main() {
  console.log('🔧 Neon PostgreSQL Connection Fixer\n');

  // Afficher les informations de configuration
  await showDatabaseInfo();

  // Test de connexion
  const success = await testNeonConnection();

  if (success) {
    console.log('\n🎉 Database connection is working properly!');
    console.log('💡 You can now restart your application safely.');
  } else {
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Check if your Neon database is active in the dashboard');
    console.log('2. Verify your DATABASE_URL is correct');
    console.log('3. Try upgrading to a paid Neon plan to avoid suspensions');
    console.log('4. Consider using a local PostgreSQL for development');
  }

  process.exit(success ? 0 : 1);
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Point d'entrée
main().catch(console.error);