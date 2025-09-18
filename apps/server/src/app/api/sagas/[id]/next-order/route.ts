import { NextRequest, NextResponse } from 'next/server';
import { SagaService } from '@/services/saga.service';
import { withBetterAuth } from '@/middlewares/auth-improved';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
    try {
      // Vérifier les droits admin
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: "Accès administrateur requis" },
          { status: 403 }
        );
      }

      // Résoudre les paramètres asynchrones
      const params = await context.params;
      const sagaId = params.id;

      const nextOrder = await SagaService.getNextSagaOrder(sagaId);
      
      return NextResponse.json({
        success: true,
        data: { nextOrder }
      });
    } catch (error: any) {
      console.error('Next order error:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Erreur lors de la récupération du prochain ordre' 
        },
        { status: error.status || 500 }
      );
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}