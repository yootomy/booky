import { z } from "zod";

export const idSchema = z.string().uuid("Invalid ID format");

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => parseInt(val || "1")),
  limit: z
    .string()
    .optional()
    .transform(val => Math.min(100, parseInt(val || "10"))),
});

export const searchSchema = z.object({
  q: z.string().min(1, "Search query is required").max(255, "Search query too long"),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const statusSchema = z.enum(["lu", "en_cours", "a_lire"]);
export const rhythmSchema = z.enum(["slow_burn", "medium_burn", "fast_pace", "insta_love"]);

export const ratingSchema = z.number().int().min(1).max(10);
export const spicyLevelSchema = z.number().int().min(1).max(10);
export const darkLevelSchema = z.number().int().min(1).max(10);
