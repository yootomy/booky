import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { nom_utilisateur, categories, tags, commentaires, userId } = data;

    // Validation basique
    if (!nom_utilisateur || !categories || !tags) {
      return NextResponse.json(
        { error: 'Nom utilisateur, catégories et tags sont requis' },
        { status: 400 }
      );
    }

    // Créer la demande de conseil
    const conseilRequest = await db.conseil_request.create({
      data: {
        id: randomUUID(),
        nom_utilisateur,
        categories: categories || [],
        tags: tags || [],
        commentaires: commentaires || null,
        userId: userId || null,
        status: 'EN_ATTENTE',
      }
    });

    return NextResponse.json({
      success: true,
      data: conseilRequest
    });

  } catch (error) {
    console.error('Erreur lors de la création de la demande de conseil:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status');
    const isAdmin = url.searchParams.get('isAdmin') === 'true';

    const whereClause: any = {};

    // Si c'est un utilisateur normal, filtrer par userId
    if (!isAdmin && userId) {
      whereClause.userId = userId;
    }

    // Filtrer par statut si spécifié
    if (status) {
      whereClause.status = status;
    }

    const conseilRequests = await db.conseil_request.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            nom_complet: true,
            email: true
          }
        }
      },
      orderBy: {
        date_creation: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: conseilRequests
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes de conseil:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}