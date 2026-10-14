import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId");

export const weightTierSchema = z.object({
  upToGrams: z.number().int().min(0),
  additionalPerKg: z.number().int().min(0),
});

export const createShippingZoneSchema = z.object({
  county: z.string().trim().min(2).max(60),
  baseFee: z.number().int().min(0),
  includedGrams: z.number().int().min(0).default(5000),
  additionalPerKg: z.number().int().min(0).default(50),
  label: z.string().trim().max(80).optional(),
  etaText: z.string().trim().max(80).optional(),
  isActive: z.boolean().default(true),
});

export const updateShippingZoneSchema = createShippingZoneSchema.partial();

export const listShippingZonesQuerySchema = z.object({
  county: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export const calculateShippingSchema = z.object({
  county: z.string().trim().min(2).max(60),
  totalWeightGrams: z.number().int().min(0),
});

export type WeightTier = z.infer<typeof weightTierSchema>;
export type CreateShippingZoneInput = z.infer<typeof createShippingZoneSchema>;
export type UpdateShippingZoneInput = z.infer<typeof updateShippingZoneSchema>;
export type ListShippingZonesQuery = z.infer<typeof listShippingZonesQuerySchema>;
export type CalculateShippingInput = z.infer<typeof calculateShippingSchema>;