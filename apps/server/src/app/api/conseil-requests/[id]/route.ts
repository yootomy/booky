import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    const { reponse_bruna, livres_recommandes, status } = data;
    const { id } = resolvedParams;

    // Mise à jour de la demande de conseil
    const updatedRequest = await db.conseil_request.update({
      where: { id },
      data: {
        reponse_bruna: reponse_bruna || null,
        livres_recommandes: livres_recommandes || [],
        status: status || 'TRAITE',
        date_reponse: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            nom_complet: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la demande de conseil:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const conseilRequest = await db.conseil_request.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nom_complet: true,
            email: true
          }
        }
      }
    });

    if (!conseilRequest) {
      return NextResponse.json(
        { error: 'Demande de conseil non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conseilRequest
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la demande de conseil:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await db.conseil_request.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Demande de conseil supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la demande de conseil:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}