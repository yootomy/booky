# 🔄 Migration Analysis: Proxy → Direct API

## ❌ Routes proxy qui n'existent PAS dans le backend
```
/books/[id]/saga           → Backend n'a pas cette route
/books/[id]/saga/neighbors → Backend n'a pas cette route
/sagas/[id]                → Backend n'a pas cette route
/sagas/[id]/reorder        → Backend n'a pas cette route
/external/google-books/book/[id] → Backend a /external/google-books/[id]
/external/open-library/book/[id] → Backend n'a pas cette route exacte
```

## ✅ Routes proxy qui existent dans le backend
```
✅ /admin/questions
✅ /auth/login, /auth/logout, /auth/profile, /auth/register, /auth/session
✅ /books, /books/[id]
✅ /books/[id]/questions, /books/[id]/questions/[questionId], /books/[id]/questions/[questionId]/like
✅ /categories, /categories/[id], /categories/[id]/stats
✅ /conseil-requests, /conseil-requests/[id]
✅ /external/google-books/import, /external/google-books/search
✅ /external/open-library/import, /external/open-library/search
✅ /external/search
✅ /favorites, /favorites/[bookId]
✅ /featured-book
✅ /lists, /lists/[id], /lists/[id]/books, /lists/[id]/books/[bookId]
✅ /sagas, /sagas/[id]/books, /sagas/[id]/check-order, /sagas/[id]/next-order
✅ /search, /search/suggest
✅ /stats/general
✅ /tags, /tags/[id]
✅ /users
```

## 🆕 Routes backend supplémentaires disponibles
```
/auth/change-password, /auth/csrf, /auth/refresh
/books/[id]/categories, /books/[id]/tags
/books/search
/categories/[id]/books, /categories/stats
/dashboard/* (current-reading, recent-books, top-rated, wishlist)
/export/* (books.csv, books.json, books.pdf, config)
/health, /wake-db
/profile
/public/homepage
/questions
/sagas/[id]/order/[order]/available
/stats/* (genres, ratings, reading, spicy-dark-levels)
/tags/* (popular, search, stats)
/upload/covers
/users/[id]/questions
```

## 🚨 Routes problématiques à corriger
1. **Saga routes** - Le proxy utilise des routes qui n'existent pas
2. **External book details** - Mappings incorrects
3. **Missing routes** - Certaines routes proxy pointent vers du vide

## 📝 Plan de migration
1. Commencer par les routes qui marchent (favorites, books, auth)
2. Corriger les routes problématiques
3. Tester chaque migration
4. Supprimer le proxy une fois validé