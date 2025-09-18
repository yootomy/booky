import { NextRequest, NextResponse } from "next/server";
import { getDatabaseHealth, DatabaseMonitor } from "@/middlewares/database-health";
import { db } from "@/utils/db";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check database health
    const dbHealth = await getDatabaseHealth();

    // Get some basic metrics
    const metrics = DatabaseMonitor.getHealthMetrics();

    // Test query performance
    const perfStart = Date.now();
    const userCount = await db.user.count();
    const bookCount = await db.book.count();
    const queryTime = Date.now() - perfStart;

    const totalTime = Date.now() - startTime;

    const healthStatus = {
      status: dbHealth.status === 'healthy' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),

      // Database health
      database: {
        ...dbHealth,
        metrics: {
          users: userCount,
          books: bookCount,
          queryTime: `${queryTime}ms`
        }
      },

      // Performance metrics
      performance: {
        responseTime: `${totalTime}ms`,
        ...metrics
      },

      // Environment info
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
        }
      }
    };

    const statusCode = healthStatus.status === 'ok' ? 200 : 503;

    return NextResponse.json(healthStatus, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      code: error.code || 'HEALTH_CHECK_FAILED'
    }, { status: 503 });
  }
}

// Endpoint de health check léger pour les load balancers
export async function HEAD(request: NextRequest) {
  try {
    // Test rapide de DB
    await db.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}