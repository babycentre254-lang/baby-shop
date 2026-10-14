import { z } from "zod";
import { paginationQuerySchema } from "./pagination.schema";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId");

export const productVariantSchema = z.object({
  sku: z.string().trim().min(3).max(50),
  size: z.string().trim().max(20).optional(),
  color: z.string().trim().max(30).optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  lowStockAt: z.number().int().min(0).default(5),
});

export const productImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().trim().max(200).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const createProductSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    description: z.string().trim().min(10).max(5000),
    shortDesc: z.string().trim().max(300).optional(),
    categoryId: objectId,
    brandId: objectId.optional(),
    basePrice: z.number().positive(),
    salePrice: z.number().positive().optional(),
    sku: z.string().trim().min(3).max(50),
    ageRange: z.string().trim().max(40).optional(),
    material: z.string().trim().max(200).optional(),
    safetyCerts: z.array(z.string().trim().max(80)).default([]),
    isPublished: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    variants: z.array(productVariantSchema).default([]),
    images: z.array(productImageSchema).default([]),
  })
  .refine(
    (data) => !data.salePrice || data.salePrice < data.basePrice,
    { message: "Sale price must be lower than base price", path: ["salePrice"] }
  );

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    shortDesc: z.string().trim().max(300).optional(),
    categoryId: objectId.optional(),
    brandId: objectId.optional(),
    basePrice: z.number().positive().optional(),
    salePrice: z.number().positive().nullable().optional(),
    sku: z.string().trim().min(3).max(50).optional(),
    ageRange: z.string().trim().max(40).optional(),
    material: z.string().trim().max(200).optional(),
    safetyCerts: z.array(z.string().trim().max(80)).optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    variants: z.array(productVariantSchema).optional(),
    images: z.array(productImageSchema).optional(),
  });

export const listProductsQuerySchema = paginationQuerySchema.extend({
  categoryId: objectId.optional(),
  categorySlug: z.string().optional(),
  brandId: objectId.optional(),
  brandSlug: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  published: z
    .string()
    .optional()
    .transform((v) => v !== "false"), // default true
  ageRange: z.string().optional(),
});

export const addProductImagesSchema = z.object({
  images: z.array(productImageSchema).min(1),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type AddProductImagesInput = z.infer<typeof addProductImagesSchema>;