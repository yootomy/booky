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

      const { searchParams } = new URL(request.url);
      const orderParam = searchParams.get('order');
      const excludeBookId = searchParams.get('excludeBookId') || undefined;
      
      if (!orderParam) {
        return NextResponse.json(
          { error: "Paramètre 'order' requis" },
          { status: 400 }
        );
      }

      const order = parseInt(orderParam);
      if (isNaN(order) || order <= 0) {
        return NextResponse.json(
          { error: "L'ordre doit être un nombre positif" },
          { status: 400 }
        );
      }
      
      const isAvailable = await SagaService.isOrderAvailable(
        sagaId,
        order,
        excludeBookId
      );

      // Optionnel : récupérer aussi le prochain ordre suggéré
      const nextOrder = await SagaService.getNextSagaOrder(sagaId);
      
      return NextResponse.json({
        success: true,
        available: isAvailable,
        suggestedNextOrder: nextOrder
      });
    } catch (error: any) {
      console.error('Check order error:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Erreur lors de la vérification de disponibilité' 
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