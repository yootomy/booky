import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbConnection } from "@/utils/db";

// Middleware pour vérifier la santé de la base de données
export async function withDatabaseHealth<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      // Test rapide de la connexion
      await db.$queryRaw`SELECT 1`;

      // Exécuter le handler normal
      return await handler(...args);
    } catch (error: any) {
      console.error("🚨 Database health check failed:", error);

      // Si c'est un problème de connexion, essayer de reconnecter
      if (error.message?.includes('connection') || error.code === 'P1001') {
        console.log("🔄 Attempting database reconnection...");

        try {
          await ensureDbConnection();
          // Retry le handler après reconnexion
          return await handler(...args);
        } catch (reconnectError) {
          console.error("❌ Database reconnection failed:", reconnectError);

          return NextResponse.json({
            success: false,
            error: "Database connection temporarily unavailable",
            code: "DB_CONNECTION_ERROR",
            retry: true
          }, { status: 503 });
        }
      }

      // Pour d'autres erreurs, re-throw
      throw error;
    }
  };
}

// Wrapper spécialement pour les routes API
export function withDatabaseHealthCheck(handler: (...args: any[]) => any) {
  return withDatabaseHealth(handler);
}

// Health check endpoint dédié
export async function getDatabaseHealth() {
  try {
    const startTime = Date.now();

    // Test de connexion basique
    await db.$queryRaw`SELECT 1`;

    // Test de performance
    const perfTest = await db.$queryRaw`SELECT COUNT(*) FROM "user"`;

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      version: process.env.DATABASE_VERSION || 'unknown',
      pool: {
        active: 'N/A', // Prisma ne expose pas ces métriques directement
        idle: 'N/A',
        waiting: 'N/A'
      }
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
  }
}

// Monitoring des performances de DB
export class DatabaseMonitor {
  private static slowQueryThreshold = 1000; // 1 seconde
  private static connectionIssues: number = 0;

  static async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      if (duration > this.slowQueryThreshold) {
        console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
      }

      // Reset connection issues counter on success
      this.connectionIssues = 0;

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error.message?.includes('connection')) {
        this.connectionIssues++;
        console.error(`💥 Connection issue #${this.connectionIssues} in ${queryName}: ${error.message}`);

        // Si trop d'erreurs de connexion, alerter
        if (this.connectionIssues >= 5) {
          console.error("🚨 CRITICAL: Multiple database connection failures detected!");
          // Ici on pourrait envoyer une alerte (email, Slack, etc.)
        }
      }

      console.error(`❌ Query failed: ${queryName} (${duration}ms):`, error.message);
      throw error;
    }
  }

  static getHealthMetrics() {
    return {
      connectionIssues: this.connectionIssues,
      threshold: this.slowQueryThreshold,
      timestamp: new Date().toISOString()
    };
  }
}