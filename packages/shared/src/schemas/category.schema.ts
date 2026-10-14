import { z } from "zod";
import { paginationQuerySchema } from "./pagination.schema";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId");

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().optional(),
  /** Single emoji or short string */
  icon: z.string().trim().max(4).optional(),
  parentId: objectId.nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  // SEO
  metaTitle: z.string().trim().max(80).optional(),
  metaDescription: z.string().trim().max(200).optional(),
  ogImage: z.string().url().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const listCategoriesQuerySchema = paginationQuerySchema.extend({
  parentId: objectId.nullable().optional(),
  rootOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  /** Admin-only: include inactive categories */
  includeInactive: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;