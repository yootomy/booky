# 🔐 PLAN D'AMÉLIORATION DU SYSTÈME D'AUTHENTIFICATION

> **Objectif** : Améliorer et sécuriser le système JWT custom existant
> **Effort total** : 8 heures
> **Date début** : 2025-10-05

---

## 📊 ÉTAT ACTUEL

- ✅ Système JWT custom avec Argon2
- ✅ Refresh tokens implémentés
- ✅ Rate limiting basique en mémoire
- ❌ Incohérence : 2 méthodes d'auth coexistent
- ❌ Pas de sessions en BDD (impossible de révoquer)
- ❌ Rate limiting en mémoire (perdu au restart)
- ❌ CSRF non implémenté
- ❌ `/api/conseil-requests` sans auth

---

## 🎯 PHASE 1 : UNIFIER L'AUTHENTIFICATION ⏱️ 2h

**Priorité** : 🔴 CRITIQUE

### Tâches

- [x] **1.1** Créer `withOptionalAuth` dans auth-improved.ts (15min)
  - Permet auth optionnelle pour routes publiques
  - ✅ `withOptionalBetterAuth` existe déjà dans auth-improved.ts

- [x] **1.2** Ajouter auth sur `/api/conseil-requests` (30min)
  - POST : Utiliser `withOptionalAuth` (accepter user connecté ou non)
  - GET : Utiliser `withBetterAuth` (admin only)
  - Fichier : `apps/server/src/app/api/conseil-requests/route.ts`
  - ✅ POST et GET migrés vers `withOptionalBetterAuth`

- [ ] **1.3** Migrer routes `/api/export/**` (30min)
  - [ ] `export/books.csv/route.ts`
  - [ ] `export/books.json/route.ts`
  - [ ] `export/books.pdf/route.ts`
  - [ ] `export/config/route.ts`

- [ ] **1.4** Migrer routes `/api/stats/**` (30min)
  - [x] `stats/general/route.ts` ✅
  - [ ] `stats/ratings/route.ts`
  - [ ] `stats/genres/route.ts`
  - [ ] `stats/spicy-dark-levels/route.ts`
  - [ ] `stats/reading/route.ts`

- [ ] **1.5** Migrer routes `/api/dashboard/**` (15min)
  - [ ] `dashboard/current-reading/route.ts`
  - [ ] `dashboard/recent-books/route.ts`
  - [ ] `dashboard/top-rated/route.ts`
  - [ ] `dashboard/wishlist/route.ts`

- [ ] **1.6** Migrer autres routes (15min)
  - [ ] `categories/[id]/stats/route.ts`
  - [ ] `categories/stats/route.ts`
  - [ ] `tags/stats/route.ts`
  - [ ] Toutes les autres routes avec `getTypedSession`

**Bénéfices** :
- ✅ Code uniforme et DRY
- ✅ Moins d'erreurs de sécurité
- ✅ -200 lignes de code dupliqué

---

## 🗄️ PHASE 2 : SESSIONS EN BASE DE DONNÉES ⏱️ 3h

**Priorité** : 🟡 HAUTE

### Tâches

- [ ] **2.1** Ajouter modèle `session` au schema Prisma (30min)
  ```prisma
  model session {
    id           String   @id @default(cuid())
    userId       String
    token        String   @unique
    refreshToken String?  @unique
    expiresAt    DateTime
    createdAt    DateTime @default(now())
    lastActivity DateTime @default(now())
    ipAddress    String?
    userAgent    String?

    user user @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId])
    @@index([expiresAt])
  }
  ```
  - [ ] Ajouter relation dans `model user`
  - [ ] Run `prisma migrate dev`
  - [ ] Run `prisma generate`

- [ ] **2.2** Modifier `createToken` pour stocker sessions (1h)
  - Fichier : `apps/server/src/lib/auth.ts`
  - [ ] Extraire IP et User-Agent de la request
  - [ ] Créer session en BDD lors du login
  - [ ] Retourner token + refreshToken

- [ ] **2.3** Modifier `verifyToken` pour vérifier sessions (1h)
  - Fichier : `apps/server/src/lib/auth.ts`
  - [ ] Vérifier que le token existe en BDD
  - [ ] Vérifier que la session n'est pas expirée
  - [ ] Mettre à jour `lastActivity`
  - [ ] Retourner null si session invalide

- [ ] **2.4** Créer route `/api/auth/sessions` (30min)
  - [ ] GET `/api/auth/sessions` - Liste sessions actives
  - [ ] DELETE `/api/auth/sessions/:id` - Révoquer une session
  - [ ] DELETE `/api/auth/sessions/all` - Déconnecter tous les appareils

- [ ] **2.5** Modifier logout pour supprimer session (15min)
  - Fichier : `apps/server/src/app/api/auth/logout/route.ts`
  - [ ] Supprimer session de la BDD
  - [ ] Clear cookies

**Bénéfices** :
- ✅ Révocation de tokens possible
- ✅ Liste des sessions actives
- ✅ Logout côté serveur fonctionnel
- ✅ Détection sessions suspectes

---

## 🚀 PHASE 3 : RATE LIMITING REDIS ⏱️ 2h

**Priorité** : 🟢 MOYENNE (OPTIONNEL)

### Tâches

- [ ] **3.1** Installer Redis (15min)
  ```bash
  npm install ioredis
  npm install -D @types/ioredis
  ```

- [ ] **3.2** Créer `lib/redis.ts` (30min)
  - [ ] Configuration Redis client
  - [ ] Helper `checkRateLimit(key, max, window)`
  - [ ] Helper `clearRateLimit(key)`
  - [ ] Gestion erreurs/fallback

- [ ] **3.3** Remplacer Map par Redis dans auth (1h)
  - Fichier : `apps/server/src/lib/auth.ts`
  - [ ] Supprimer `loginAttempts Map`
  - [ ] Utiliser Redis pour rate limiting
  - [ ] Ajouter rate limiting sur :
    - [ ] `/api/auth/login` (5 req/5min)
    - [ ] `/api/auth/register` (3 req/10min)
    - [ ] `/api/books/search` (30 req/min)
    - [ ] `/api/external/**` (10 req/min)

- [ ] **3.4** Ajouter configuration .env (15min)
  ```env
  REDIS_URL=redis://localhost:6379
  AUTH_RATE_LIMIT_MAX=5
  AUTH_RATE_LIMIT_WINDOW_MS=300000
  ```

**Bénéfices** :
- ✅ Rate limiting multi-serveur
- ✅ Persistant entre restarts
- ✅ Scalable

---

## 🛡️ PHASE 4 : CSRF PROTECTION ⏱️ 1h

**Priorité** : 🟢 BASSE (OPTIONNEL)

### Tâches

- [ ] **4.1** Créer middleware CSRF (30min)
  - Fichier : `apps/server/src/middlewares/csrf.ts`
  - [ ] Fonction `generateCSRFToken()`
  - [ ] Fonction `withCSRF(handler)`
  - [ ] Vérification token dans headers vs cookie

- [ ] **4.2** Appliquer aux routes sensibles (30min)
  - [ ] `/api/auth/login`
  - [ ] `/api/books` (POST/PUT/DELETE)
  - [ ] `/api/categories` (POST/PUT/DELETE)
  - [ ] `/api/tags` (POST/PUT/DELETE)
  - [ ] `/api/lists` (POST/PUT/DELETE)

- [ ] **4.3** Modifier `/api/auth/csrf` pour générer tokens (15min)
  - Fichier : `apps/server/src/app/api/auth/csrf/route.ts`
  - [ ] Générer token CSRF
  - [ ] Stocker dans cookie
  - [ ] Retourner au client

**Bénéfices** :
- ✅ Protection contre attaques CSRF
- ✅ Sécurité renforcée

---

## 📝 TÂCHES BONUS (NON PRIORITAIRES)

- [ ] **BONUS.1** Ajouter tests unitaires pour auth
  - [ ] Tests pour `hashPassword` / `verifyPassword`
  - [ ] Tests pour `createToken` / `verifyToken`
  - [ ] Tests pour `withBetterAuth` middleware
  - [ ] Tests pour rate limiting

- [ ] **BONUS.2** Logger structuré (winston/pino)
  - [ ] Remplacer console.log par logger
  - [ ] Niveaux : debug, info, warn, error
  - [ ] Format JSON structuré
  - [ ] Rotation des logs

- [ ] **BONUS.3** Ajouter 2FA (si besoin)
  - [ ] TOTP avec speakeasy
  - [ ] QR code generation
  - [ ] Backup codes

---

## 📈 MÉTRIQUES DE SUCCÈS

### Avant amélioration
- Routes avec auth incohérente : 42/75 (56%)
- Routes sans auth : 3/75 (4%)
- Révocation tokens : ❌ Impossible
- Rate limiting : ⚠️ En mémoire (volatile)
- CSRF protection : ❌ Non fonctionnel

### Après Phase 1
- Routes avec auth incohérente : 0/75 (0%) ✅
- Routes sans auth : 0/75 (0%) ✅
- Code dupliqué : -200 lignes ✅

### Après Phase 2
- Révocation tokens : ✅ Possible
- Sessions actives : ✅ Listables
- Logout serveur : ✅ Fonctionnel

### Après Phase 3
- Rate limiting : ✅ Redis (persistant)
- Multi-serveur : ✅ Compatible

### Après Phase 4
- CSRF protection : ✅ Fonctionnel

---

## 🔄 ORDRE D'EXÉCUTION

1. **PRIORITÉ 1** : Phase 1 (Unifier auth) - 2h
2. **PRIORITÉ 2** : Phase 2 (Sessions BDD) - 3h
3. **OPTIONNEL** : Phase 3 (Redis) - 2h
4. **OPTIONNEL** : Phase 4 (CSRF) - 1h

**Temps minimal** : 5h (Phases 1+2)
**Temps complet** : 8h (toutes phases)

---

## 📅 PLANNING

- [x] Analyse système actuel
- [x] Création plan d'action
- [ ] Phase 1 : Unification auth
- [ ] Phase 2 : Sessions BDD
- [ ] Phase 3 : Redis (optionnel)
- [ ] Phase 4 : CSRF (optionnel)
- [ ] Tests & validation
- [ ] Documentation mise à jour

---

## 🚨 ROLLBACK PLAN

Si problème lors de la migration :

1. **Revenir au commit précédent**
   ```bash
   git revert HEAD
   ```

2. **Rollback migrations Prisma**
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Restaurer cache Redis**
   ```bash
   redis-cli FLUSHALL
   ```

---

**Dernière mise à jour** : 2025-10-05
**Status** : 🟡 EN COURS
