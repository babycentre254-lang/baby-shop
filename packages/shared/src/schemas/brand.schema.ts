import { z } from "zod";
import { paginationQuerySchema } from "./pagination.schema";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId");

export const createBrandSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
  // SEO
  metaTitle: z.string().trim().max(80).optional(),
  metaDescription: z.string().trim().max(200).optional(),
  ogImage: z.string().url().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export const listBrandsQuerySchema = paginationQuerySchema.extend({
  includeInactive: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type ListBrandsQuery = z.infer<typeof listBrandsQuerySchema>;