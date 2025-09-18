import { NextRequest, NextResponse } from "next/server";
import { wakeUpNeonDatabase, getDbInstance } from "@/utils/db";

export async function POST(request: NextRequest) {
  console.log('🌅 Manual database wake-up requested...');

  try {
    // Tenter de réveiller la base
    const wakeUpSuccess = await wakeUpNeonDatabase();

    if (!wakeUpSuccess) {
      return NextResponse.json({
        success: false,
        message: "Failed to wake up database",
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Tester la connexion après réveil
    const startTime = Date.now();
    const instance = await getDbInstance();
    await instance.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    // Test rapide des tables principales
    const [userCount, bookCount] = await Promise.all([
      instance.user.count(),
      instance.book.count()
    ]);

    console.log('✅ Database woke up and tested successfully');

    return NextResponse.json({
      success: true,
      message: "Database woke up successfully",
      responseTime: `${responseTime}ms`,
      data: {
        users: userCount,
        books: bookCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Database wake-up failed:', error);

    return NextResponse.json({
      success: false,
      message: "Database wake-up failed",
      error: error.message,
      code: error.code || 'WAKE_UP_FAILED',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  // GET version pour les tests rapides
  return POST(request);
}