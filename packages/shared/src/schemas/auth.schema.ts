import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/\d/, "Must contain a number");

const phoneSchema = z
  .string()
  .regex(/^(\+?254|0)[17]\d{8}$/, "Enter a valid Kenyan phone number")
  .transform((v) => {
    // normalize to +2547XXXXXXXX
    if (v.startsWith("0")) return `+254${v.slice(1)}`;
    if (v.startsWith("254")) return `+${v}`;
    return v;
  });

export const registerSchema = z.object({
  firstName: z.string().min(1).max(60).trim(),
  lastName: z.string().min(1).max(60).trim(),
  email: z.string().email().toLowerCase().trim(),
  phone: phoneSchema.optional(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const refreshSchema = z.object({
  // Optional — refresh token comes from httpOnly cookie,
  // but accept it in body for mobile clients
  refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
  password: passwordSchema,
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(60).trim().optional(),
  lastName: z.string().min(1).max(60).trim().optional(),
  phone: phoneSchema.optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
