import { PrismaClient } from "../../prisma/generated/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Instance simple et robuste
let dbInstance: PrismaClient | null = null;
let isConnecting = false;

// Fonction pour créer/obtenir l'instance de base avec retry
export async function getDbInstance(): Promise<PrismaClient> {
  // Si on a une instance qui fonctionne, la retourner
  if (dbInstance && await testConnection(dbInstance)) {
    return dbInstance;
  }

  // Si on est déjà en train de se reconnecter, attendre
  if (isConnecting) {
    await waitForConnection();
    return dbInstance!;
  }

  console.log('🔄 Database connection lost, attempting to reconnect...');
  isConnecting = true;

  try {
    // Fermer l'ancienne connexion si elle existe
    if (dbInstance) {
      try {
        await dbInstance.$disconnect();
      } catch {}
      dbInstance = null;
    }

    // Créer une nouvelle instance simple
    dbInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Tenter la connexion avec retry
    await connectWithRetry(dbInstance);

    console.log('✅ Database reconnected successfully');
    isConnecting = false;
    return dbInstance;

  } catch (error) {
    isConnecting = false;
    console.error('❌ Failed to reconnect to database:', error);
    throw new Error('Database connection unavailable');
  }
}

// Test rapide de connexion
async function testConnection(client: PrismaClient): Promise<boolean> {
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Retry de connexion avec backoff
async function connectWithRetry(client: PrismaClient, maxAttempts = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Connection attempt ${attempt}/${maxAttempts}...`);
      await client.$queryRaw`SELECT 1`;
      console.log(`✅ Connection successful on attempt ${attempt}`);
      return;
    } catch (error: any) {
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message);

      if (attempt === maxAttempts) {
        throw new Error(`All ${maxAttempts} connection attempts failed`);
      }

      // Attendre avant retry avec délai croissant
      const delay = 2000 * attempt;
      console.log(`⏰ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Attendre la fin de la connexion
async function waitForConnection(): Promise<void> {
  while (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Export de l'instance principale - simple et efficace
export const db = new Proxy({} as PrismaClient, {
  get(target, prop) {
    return new Proxy(() => {}, {
      get(_, methodProp) {
        return async (...args: any[]) => {
          try {
            const instance = await getDbInstance();
            const table = (instance as any)[prop];
            const method = table[methodProp];

            if (typeof method === 'function') {
              return await method.apply(table, args);
            }
            return method;
          } catch (error: any) {
            console.error(`❌ Database operation ${String(prop)}.${String(methodProp)} failed:`, error.message);

            // Retry une fois si c'est un problème de connexion
            if (error.code === 'P1001' || error.message.includes("Can't reach database")) {
              console.log('🔄 Retrying after connection error...');

              try {
                const instance = await getDbInstance();
                const table = (instance as any)[prop];
                const method = table[methodProp];

                if (typeof method === 'function') {
                  return await method.apply(table, args);
                }
                return method;
              } catch (retryError) {
                console.error('❌ Retry also failed:', retryError);
                throw retryError;
              }
            }

            throw error;
          }
        };
      },
      apply: async (_, __, args) => {
        const instance = await getDbInstance();
        const method = (instance as any)[prop];
        return await method.apply(instance, args);
      }
    });
  }
});

// Fonction de reconnexion automatique (legacy)
export async function ensureDbConnection() {
  try {
    await getDbInstance();
    console.log('✅ Database connection verified');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

// Fonction pour réveiller manuellement la base Neon
export async function wakeUpNeonDatabase() {
  console.log('🌅 Attempting to wake up Neon database...');

  try {
    const tempClient = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } }
    });

    await tempClient.$queryRaw`SELECT pg_sleep(0.5)`;
    await tempClient.$disconnect();

    console.log('✅ Database woke up successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to wake up database:', error);
    return false;
  }
}

// Gestionnaires de fermeture propre
process.on('beforeExit', async () => {
  if (dbInstance) {
    await dbInstance.$disconnect();
  }
});

process.on('SIGINT', async () => {
  if (dbInstance) {
    await dbInstance.$disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (dbInstance) {
    await dbInstance.$disconnect();
  }
  process.exit(0);
});

// Test de connexion au démarrage
ensureDbConnection();