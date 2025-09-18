-- ============================================================================
-- 🚀 SCRIPT D'OPTIMISATION POSTGRESQL POUR BOOKY
-- ============================================================================

-- Configuration de PostgreSQL pour éviter les connexions fermées
-- Ajustement des timeouts et pools

-- 1. Configuration des connexions et timeouts
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Timeouts pour éviter les connexions fermées
ALTER SYSTEM SET tcp_keepalives_idle = 600;
ALTER SYSTEM SET tcp_keepalives_interval = 30;
ALTER SYSTEM SET tcp_keepalives_count = 3;
ALTER SYSTEM SET tcp_user_timeout = 30000;

-- Statement timeout (30 secondes)
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';

-- 2. Configuration des logs pour le debugging
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s

-- 3. Optimisations pour les requêtes fréquentes
-- Index composites pour les livres
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_search
ON book USING gin(to_tsvector('french', titre || ' ' || auteur || ' ' || COALESCE(resume_officiel, '') || ' ' || COALESCE(resume_personnel, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_filters
ON book (statut, note_generale, niveau_spicy, niveau_dark, date_creation);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_user_status
ON book ("createdBy", statut, date_creation);

-- Index pour les favoris
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_created
ON book_favorite ("userId", "createdAt");

-- Index pour les catégories de livres
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_book_category_book
ON book_category ("bookId", "categoryId");

-- Index pour les tags de livres
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_book_tag_book
ON book_tag ("bookId", "tagId");

-- Index pour les questions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_book_status
ON book_question ("bookId", status, date_question);

-- 4. Statistiques pour l'optimiseur
ANALYZE book;
ANALYZE book_favorite;
ANALYZE book_category;
ANALYZE book_tag;
ANALYZE book_question;
ANALYZE "user";

-- 5. Configuration pour éviter les deadlocks
ALTER SYSTEM SET deadlock_timeout = '1s';
ALTER SYSTEM SET lock_timeout = '10s';

-- 6. Configuration du WAL pour de meilleures performances
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET checkpoint_timeout = '10min';

-- Recharger la configuration
SELECT pg_reload_conf();

-- ============================================================================
-- 📊 REQUÊTES DE MONITORING
-- ============================================================================

-- Voir les connexions actives
-- SELECT pid, usename, application_name, client_addr, state, query_start, query
-- FROM pg_stat_activity
-- WHERE state = 'active';

-- Voir les requêtes lentes
-- SELECT query, mean_exec_time, calls, total_exec_time
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- Voir les index non utilisés
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0;

-- Voir la taille des tables
-- SELECT schemaname, tablename,
--        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;