import { NextRequest, NextResponse } from "next/server";
import { SagaService } from "@/services/saga.service";
import { SagaFiltersSchema, CreateSagaSchema } from "@/schemas/saga.schemas";
import { withBetterAuth } from "@/middlewares/auth-improved";

// GET /api/sagas - Liste des sagas (public)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const search = url.searchParams.get('search') || undefined;
    const statusParam = url.searchParams.get('status');
    const status = statusParam && ['ONGOING', 'COMPLETED', 'HIATUS', 'UNKNOWN'].includes(statusParam) 
      ? statusParam as 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'UNKNOWN'
      : undefined;

    console.log(`🔍 API Sagas - Page: ${page}, PageSize: ${pageSize}, Search: ${search}, Status: ${status}`);

    const filters = { page, pageSize, search, status };
    const result = await SagaService.getSagas(filters);
    
    console.log(`✅ API Sagas - Résultat: ${result.data.length} sagas trouvées`);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error("❌ API Sagas Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch sagas",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/sagas - Créer une saga (admin uniquement)
export async function POST(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      // Vérifier les droits admin
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: "Accès administrateur requis" },
          { status: 403 }
        );
      }

      const body = await req.json();
      const validatedData = CreateSagaSchema.parse(body);
      
      console.log(`📝 Création saga par ${user.nom_complet}:`, validatedData.name);
      
      const saga = await SagaService.createSaga(validatedData);
      
      console.log(`✅ Saga créée: ${saga.name} (${saga.id})`);

      return NextResponse.json({
        success: true,
        data: saga
      });

    } catch (error) {
      console.error("❌ Erreur création saga:", error);
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to create saga",
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}