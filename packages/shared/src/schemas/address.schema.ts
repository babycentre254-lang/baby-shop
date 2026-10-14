import { z } from "zod";

export const KENYAN_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu",
  "Machakos", "Kajiado", "Murang'a", "Nyeri", "Kakamega", "Bungoma",
  "Kisii", "Meru", "Embu", "Kilifi", "Kwale", "Taita Taveta", "Laikipia",
  "Narok", "Kericho", "Bomet", "Nyamira", "Homa Bay", "Migori",
  "Siaya", "Vihiga", "Busia", "Trans Nzoia", "West Pokot", "Turkana",
  "Samburu", "Isiolo", "Marsabit", "Mandera", "Wajir", "Garissa",
  "Tana River", "Lamu", "Tana River", "Tharaka Nithi", "Kirinyaga",
  "Nyandarua", "Elgeyo Marakwet", "Baringo", "Nandi", "Kitui",
  "Makueni", "Kajiado", "Nairobi",
] as const;

export const createAddressSchema = z.object({
  label: z.string().trim().min(1).max(40).default("Home"),
  fullName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .regex(/^(\+?254|0)[17]\d{8}$/, "Enter a valid Kenyan phone number")
    .transform((v) => {
      if (v.startsWith("0")) return `+254${v.slice(1)}`;
      if (v.startsWith("254")) return `+${v}`;
      return v;
    }),
  county: z.string().trim().min(2).max(60),
  town: z.string().trim().min(2).max(80),
  street: z.string().trim().min(2).max(200),
  notes: z.string().trim().max(300).optional(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;