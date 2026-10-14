import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId");

export const addToCartSchema = z.object({
  variantId: objectId,
  quantity: z.number().int().min(1).max(50),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(50),
});

export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: objectId,
        quantity: z.number().int().min(1).max(50),
      })
    )
    .max(100),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type MergeCartInput = z.infer<typeof mergeCartSchema>;