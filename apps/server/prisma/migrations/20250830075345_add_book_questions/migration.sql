-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."export_format" AS ENUM ('JSON', 'CSV', 'PDF');

-- CreateEnum
CREATE TYPE "public"."BookStatus" AS ENUM ('LU', 'EN_COURS', 'A_LIRE');

-- CreateEnum
CREATE TYPE "public"."BookRhythm" AS ENUM ('SLOW_BURN', 'MEDIUM_BURN', 'FAST_PACE', 'INSTA_LOVE');

-- CreateEnum
CREATE TYPE "public"."TagType" AS ENUM ('GENRE', 'TROPE', 'TRIGGER', 'PERSONNALISE');

-- CreateEnum
CREATE TYPE "public"."BookQuestionStatus" AS ENUM ('PENDING', 'ANSWERED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."user" (
    "_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "nom_complet" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "image" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ADMIN',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "derniere_connexion" TIMESTAMP(3),
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "_id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "_id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."export_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "format" "public"."export_format" NOT NULL,
    "default_options" JSONB NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "export_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."book" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "isbn" TEXT,
    "image_couverture" TEXT,
    "google_books_id" TEXT,
    "open_library_id" TEXT,
    "resume_officiel" TEXT,
    "editeur" TEXT,
    "date_publication" TIMESTAMP(3),
    "nombre_pages" INTEGER,
    "langue" TEXT,
    "date_lecture" TIMESTAMP(3),
    "statut" "public"."BookStatus" NOT NULL DEFAULT 'A_LIRE',
    "note_generale" INTEGER NOT NULL,
    "niveau_spicy" INTEGER NOT NULL,
    "niveau_dark" INTEGER NOT NULL,
    "niveau_romance" INTEGER NOT NULL,
    "intensite_emotionnelle" INTEGER NOT NULL,
    "danger" INTEGER NOT NULL,
    "violence" INTEGER NOT NULL,
    "originalite" INTEGER NOT NULL,
    "rythme" "public"."BookRhythm" NOT NULL,
    "resume_personnel" TEXT,
    "critique_detaillee" TEXT,
    "citations_favorites" TEXT,
    "pourquoi_aimer" TEXT,
    "questions_sur_le_livre" TEXT,
    "recommandation_personnalisee" TEXT,
    "ajout_manuel" BOOLEAN NOT NULL DEFAULT false,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couleur" TEXT NOT NULL,
    "icone" TEXT,
    "description" TEXT,
    "ordre_affichage" INTEGER NOT NULL DEFAULT 0,
    "est_actif" BOOLEAN NOT NULL DEFAULT true,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tag" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couleur" TEXT NOT NULL,
    "type" "public"."TagType" NOT NULL DEFAULT 'PERSONNALISE',
    "utilisation_count" INTEGER NOT NULL DEFAULT 0,
    "est_favori" BOOLEAN NOT NULL DEFAULT false,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."book_category" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "book_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."book_tag" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "book_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."book_question" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "reponse" TEXT,
    "date_question" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_reponse" TIMESTAMP(3),
    "status" "public"."BookQuestionStatus" NOT NULL DEFAULT 'PENDING',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "bookId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "answeredById" TEXT,

    CONSTRAINT "book_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."book_question_like" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_question_like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."upload_records" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "compressionRatio" INTEGER DEFAULT 0,
    "uploadedBy" TEXT NOT NULL,
    "bookId" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE INDEX "export_configs_createdBy_idx" ON "public"."export_configs"("createdBy");

-- CreateIndex
CREATE INDEX "export_configs_createdBy_is_default_idx" ON "public"."export_configs"("createdBy", "is_default");

-- CreateIndex
CREATE INDEX "export_configs_createdBy_is_active_idx" ON "public"."export_configs"("createdBy", "is_active");

-- CreateIndex
CREATE INDEX "book_titre_idx" ON "public"."book"("titre");

-- CreateIndex
CREATE INDEX "book_auteur_idx" ON "public"."book"("auteur");

-- CreateIndex
CREATE INDEX "book_statut_idx" ON "public"."book"("statut");

-- CreateIndex
CREATE INDEX "book_date_lecture_idx" ON "public"."book"("date_lecture");

-- CreateIndex
CREATE INDEX "book_note_generale_idx" ON "public"."book"("note_generale");

-- CreateIndex
CREATE INDEX "book_createdBy_idx" ON "public"."book"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "category_nom_key" ON "public"."category"("nom");

-- CreateIndex
CREATE INDEX "category_nom_idx" ON "public"."category"("nom");

-- CreateIndex
CREATE INDEX "category_ordre_affichage_idx" ON "public"."category"("ordre_affichage");

-- CreateIndex
CREATE UNIQUE INDEX "tag_nom_key" ON "public"."tag"("nom");

-- CreateIndex
CREATE INDEX "tag_nom_idx" ON "public"."tag"("nom");

-- CreateIndex
CREATE INDEX "tag_type_idx" ON "public"."tag"("type");

-- CreateIndex
CREATE INDEX "tag_utilisation_count_idx" ON "public"."tag"("utilisation_count");

-- CreateIndex
CREATE UNIQUE INDEX "book_category_bookId_categoryId_key" ON "public"."book_category"("bookId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "book_tag_bookId_tagId_key" ON "public"."book_tag"("bookId", "tagId");

-- CreateIndex
CREATE INDEX "book_question_bookId_idx" ON "public"."book_question"("bookId");

-- CreateIndex
CREATE INDEX "book_question_authorId_idx" ON "public"."book_question"("authorId");

-- CreateIndex
CREATE INDEX "book_question_status_idx" ON "public"."book_question"("status");

-- CreateIndex
CREATE INDEX "book_question_date_question_idx" ON "public"."book_question"("date_question");

-- CreateIndex
CREATE UNIQUE INDEX "book_question_like_questionId_userId_key" ON "public"."book_question_like"("questionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "upload_records_fileName_key" ON "public"."upload_records"("fileName");

-- CreateIndex
CREATE INDEX "upload_records_uploadedBy_idx" ON "public"."upload_records"("uploadedBy");

-- CreateIndex
CREATE INDEX "upload_records_bookId_idx" ON "public"."upload_records"("bookId");

-- CreateIndex
CREATE INDEX "upload_records_uploadedAt_idx" ON "public"."upload_records"("uploadedAt");

-- CreateIndex
CREATE INDEX "upload_records_uploadedBy_uploadedAt_idx" ON "public"."upload_records"("uploadedBy", "uploadedAt");

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."export_configs" ADD CONSTRAINT "export_configs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book" ADD CONSTRAINT "book_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_category" ADD CONSTRAINT "book_category_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_category" ADD CONSTRAINT "book_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_tag" ADD CONSTRAINT "book_tag_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_tag" ADD CONSTRAINT "book_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_question" ADD CONSTRAINT "book_question_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_question" ADD CONSTRAINT "book_question_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_question" ADD CONSTRAINT "book_question_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "public"."user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_question_like" ADD CONSTRAINT "book_question_like_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."book_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_question_like" ADD CONSTRAINT "book_question_like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_records" ADD CONSTRAINT "upload_records_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_records" ADD CONSTRAINT "upload_records_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
