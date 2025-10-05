import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { randomUUID } from "crypto";
import { withOptionalBetterAuth } from '@/middlewares/auth-improved';

export async function POST(request: NextRequest) {
  return withOptionalBetterAuth(request, async (req, user) => {
    try {
      const data = await req.json();
      const { nom_utilisateur, categories, tags, commentaires } = data;

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
          userId: user?.id || null, // Utiliser l'ID de l'utilisateur connecté si disponible
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
  });
}

export async function GET(request: NextRequest) {
  return withOptionalBetterAuth(request, async (req, user) => {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get('status');

      const whereClause: any = {};

      // Si c'est un utilisateur normal, filtrer par userId
      // Si admin, voir toutes les demandes
      if (user && user.role !== 'ADMIN') {
        whereClause.userId = user.id;
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
  });
}