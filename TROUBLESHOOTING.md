# 🚨 Guide de Dépannage Booky

## 🔧 Problème de Connexions PostgreSQL Fermées

## 🚨 **NEON DATABASE SUSPENDUE** (NOUVEAU)

### Symptômes
```
Can't reach database server at `ep-spring-sea-a28hzmig-pooler.eu-central-1.aws.neon.tech:5432`
Error code: P1001
```

### ⚡ **SOLUTIONS IMMÉDIATES**

#### Option 1: Réveiller Neon (Recommandé)
```bash
# Diagnostic complet
bun run db:fix

# Réveil rapide via API
bun run db:wake

# Vérification de santé
bun run db:health
```

#### Option 2: Basculer vers PostgreSQL local
```bash
# 1. Installer PostgreSQL localement
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql

# 2. Créer la base locale
createdb booky_local

# 3. Basculer vers la config locale
cp apps/server/.env.local-fallback apps/server/.env

# 4. Migrer le schéma
bun run db:push

# 5. Redémarrer
bun run dev:server
```

### 🎯 **Nouvelle Architecture Anti-Suspension**

1. **Gestionnaire de connexion intelligent** avec retry automatique
2. **Proxy de base de données** qui gère les reconnexions
3. **Wake-up automatique** pour les bases Neon suspendues
4. **Monitoring en temps réel** des connexions

### Symptômes
```
prisma:error Error in PostgreSQL connection: Error { kind: Closed, cause: None }
```

### ✅ Solutions Appliquées

1. **Configuration du pool de connexions optimisée** dans `db.ts`
2. **Paramètres d'URL de base de données améliorés** dans `.env`
3. **Monitoring des requêtes** avec `DatabaseMonitor`
4. **Health check endpoint** : `/api/health`

### 🛠️ Commandes de Diagnostic

```bash
# Vérifier la santé de la base de données
bun run db:health

# Optimiser la base de données
bun run db:optimize

# Tester les connexions
curl http://localhost:3000/api/health
```

### 🔍 Monitoring en Temps Réel

1. **Endpoint de santé** : `GET /api/health`
2. **Logs de connexion** : Consultez les logs de développement
3. **Métriques de performance** : Incluses dans le health check

### ⚡ Actions Immédiates

Si le problème persiste :

1. **Redémarrer le serveur** :
   ```bash
   # Arrêter
   Ctrl+C

   # Relancer
   bun run dev:server
   ```

2. **Vérifier Neon PostgreSQL** :
   - Se connecter au dashboard Neon
   - Vérifier les métriques de connexion
   - S'assurer que la base n'est pas suspendue

3. **Réinitialiser les connexions** :
   ```bash
   # Forcer la reconnexion
   bun run db:push
   ```

### 🎯 Configuration Recommandée

#### Variables d'environnement (.env)
```env
DB_CONNECTION_POOL_SIZE=15
DB_CONNECTION_TIMEOUT=30000
DB_QUERY_TIMEOUT=20000
DB_STATEMENT_TIMEOUT=30000
```

#### URL de base de données
```
DATABASE_URL="...?pgbouncer=true&connection_limit=20&pool_timeout=30&connect_timeout=60"
```

### 📊 Métriques de Performance

- **Temps de réponse normal** : < 500ms
- **Connexions simultanées** : Max 15-20
- **Timeout de requête** : 20 secondes
- **Pool timeout** : 30 secondes

### 🚀 Optimisations Appliquées

1. ✅ Pool de connexions configuré
2. ✅ Timeouts optimisés
3. ✅ Reconnexion automatique
4. ✅ Monitoring des requêtes lentes
5. ✅ Health check endpoint
6. ✅ Gestion propre des déconnexions

### 📱 Test de Fonctionnement

Après redémarrage, vérifiez :

1. `http://localhost:3000/api/health` retourne 200
2. Plus d'erreurs `Closed connection` dans les logs
3. Temps de réponse des API < 1 seconde
4. Interface utilisateur fluide

### ⚠️ Si le Problème Persiste

1. **Vérifier la base Neon** :
   - Peut être en veille (plan gratuit)
   - Limites de connexion atteintes

2. **Alternative locale** :
   ```bash
   # Utiliser PostgreSQL local si nécessaire
   DATABASE_URL="postgresql://localhost:5432/booky"
   ```

3. **Contact support** :
   - Logs complets du serveur
   - Sortie de `/api/health`
   - Configuration actuelle

---

## 🎉 Résolution Attendue

Après ces modifications :
- ✅ Connexions stables
- ✅ Pas d'erreurs de fermeture
- ✅ Performance améliorée
- ✅ Monitoring actif