import { PrismaClient } from "../../prisma/generated/client";

// Gestionnaire de connexion avec retry automatique pour Neon
export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private client: PrismaClient | null = null;
  private isConnecting = false;
  private retryCount = 0;
  private maxRetries = 5;
  private retryDelay = 2000; // 2 secondes

  private constructor() {}

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  async getClient(): Promise<PrismaClient> {
    if (this.client && await this.testConnection()) {
      return this.client;
    }

    if (this.isConnecting) {
      // Si une connexion est en cours, attendre
      await this.waitForConnection();
      return this.client!;
    }

    return await this.createConnection();
  }

  private async createConnection(): Promise<PrismaClient> {
    this.isConnecting = true;

    try {
      console.log('🔄 Creating new database connection...');

      // Fermer l'ancienne connexion si elle existe
      if (this.client) {
        await this.client.$disconnect();
        this.client = null;
      }

      // Créer une nouvelle connexion avec configuration optimisée
      this.client = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
        // Pas de configuration de pool ici - géré par l'URL de connexion
      });

      // Test de connexion avec retry
      await this.connectWithRetry();

      console.log('✅ Database connection established successfully');
      this.retryCount = 0;
      this.isConnecting = false;

      return this.client;

    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to create database connection:', error);
      throw new Error(`Database connection failed after ${this.retryCount} attempts: ${error}`);
    }
  }

  private async connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Connection attempt ${attempt}/${this.maxRetries}...`);

        // Tenter la connexion avec un simple ping
        await this.client!.$queryRaw`SELECT 1`;

        console.log(`✅ Connection successful on attempt ${attempt}`);
        return;

      } catch (error: any) {
        console.error(`❌ Connection attempt ${attempt} failed:`, error.message);

        if (attempt === this.maxRetries) {
          throw new Error(`All ${this.maxRetries} connection attempts failed. Last error: ${error.message}`);
        }

        // Attendre avant le prochain essai avec backoff exponentiel
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏰ Waiting ${delay}ms before retry...`);
        await this.sleep(delay);
      }
    }
  }

  private async testConnection(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async waitForConnection(): Promise<void> {
    while (this.isConnecting) {
      await this.sleep(100);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect();
      this.client = null;
    }
  }

  // Méthode pour "réveiller" une base Neon suspendue
  async wakeUpDatabase(): Promise<boolean> {
    console.log('🌅 Attempting to wake up Neon database...');

    try {
      // Créer une connexion temporaire pour réveiller la base
      const tempClient = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_URL } }
      });

      // Requête simple pour réveiller la base
      await tempClient.$queryRaw`SELECT pg_sleep(0.1)`;
      await tempClient.$disconnect();

      console.log('✅ Database woke up successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to wake up database:', error);
      return false;
    }
  }
}

// Instance globale
const dbManager = DatabaseConnectionManager.getInstance();

// Export de la fonction principale
export async function getDatabase(): Promise<PrismaClient> {
  return await dbManager.getClient();
}

// Gestionnaire de fermeture propre
process.on('beforeExit', async () => {
  await dbManager.disconnect();
});

process.on('SIGINT', async () => {
  await dbManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await dbManager.disconnect();
  process.exit(0);
});