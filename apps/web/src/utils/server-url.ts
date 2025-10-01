/**
 * Utilitaire pour récupérer l'URL du serveur backend
 * Supporte l'accès via réseau local pour les appareils mobiles
 */
export function getServerUrl(): string {
  return process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
}