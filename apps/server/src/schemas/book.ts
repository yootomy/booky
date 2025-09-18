import { z } from "zod";
import {
  statusSchema,
  rhythmSchema,
  ratingSchema,
  spicyLevelSchema,
  darkLevelSchema,
} from "../validators/common";

export const createBookSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  author: z.string().min(1, "Author is required").max(200, "Author name too long"),
  isbn: z.string().optional(),
  coverImage: z.string().url().optional(),
  officialSummary: z.string().optional(),
  publisher: z.string().optional(),
  publishedDate: z.string().datetime().optional(),
  pageCount: z.number().int().positive().optional(),
  language: z.string().optional(),
  readDate: z.string().datetime().optional(),
  status: statusSchema,
  generalRating: ratingSchema,
  spicyLevel: spicyLevelSchema,
  darkLevel: darkLevelSchema,
  romanceLevel: ratingSchema,
  emotionalIntensity: ratingSchema,
  danger: ratingSchema,
  violence: ratingSchema,
  originality: ratingSchema,
  rhythm: rhythmSchema,
  personalSummary: z.string().optional(),
  detailedReview: z.string().optional(),
  favoritQuotes: z.string().optional(),
  whyYouMightLike: z.string().optional(),
  questionsAboutBook: z.string().optional(),
  personalRecommendation: z.string().optional(),
  googleBooksId: z.string().optional(),
  openLibraryId: z.string().optional(),
  manuallyAdded: z.boolean().default(false),
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateBookSchema = createBookSchema.partial();

export const bookQuerySchema = z.object({
  q: z.string().optional(),
  status: statusSchema.optional(),
  genre: z.string().optional(),
  author: z.string().optional(),
  spicyLevel: z
    .string()
    .transform(val => parseInt(val))
    .pipe(spicyLevelSchema)
    .optional(),
  darkLevel: z
    .string()
    .transform(val => parseInt(val))
    .pipe(darkLevelSchema)
    .optional(),
  romanceLevel: z
    .string()
    .transform(val => parseInt(val))
    .pipe(ratingSchema)
    .optional(),
  minRating: z
    .string()
    .transform(val => parseInt(val))
    .pipe(ratingSchema)
    .optional(),
  maxRating: z
    .string()
    .transform(val => parseInt(val))
    .pipe(ratingSchema)
    .optional(),
  tags: z
    .string()
    .transform(val => val.split(","))
    .optional(),
  categories: z
    .string()
    .transform(val => val.split(","))
    .optional(),
  sortBy: z.enum(["title", "author", "readDate", "generalRating", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z
    .string()
    .transform(val => Math.max(1, parseInt(val || "1")))
    .optional(),
  limit: z
    .string()
    .transform(val => Math.max(1, Math.min(100, parseInt(val || "10"))))
    .optional(),
});

export type CreateBookData = z.infer<typeof createBookSchema>;
export type UpdateBookData = z.infer<typeof updateBookSchema>;
export type BookQueryParams = z.infer<typeof bookQuerySchema>;
