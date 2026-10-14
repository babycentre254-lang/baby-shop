import { z } from "zod";

/**
 * Fail-fast environment validation.
 * If any of these are missing/malformed, the API won't even boot.
 * `.passthrough()` keeps unknown keys (like MPESA_*) in the returned object.
 */
const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().default(4000),
    API_PREFIX: z.string().default("api/v1"),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),

    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().default(6379),

    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    COOKIE_DOMAIN: z.string().default("localhost"),
    COOKIE_SECURE: z
      .string()
      .default("false")
      .transform((v) => v === "true"),
    COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),

    // ─── M-Pesa (optional — dev can boot without them) ───
    MPESA_ENV: z.string().default("sandbox"),
    MPESA_CONSUMER_KEY: z.string().default(""),
    MPESA_CONSUMER_SECRET: z.string().default(""),
    MPESA_SHORTCODE: z.string().default(""),
    MPESA_PASSKEY: z.string().default(""),
    MPESA_CALLBACK_URL: z.string().default(""),

    SMTP_HOST: z.string().default(""),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().default(""),
    SMTP_PASS: z.string().default(""),
    MAIL_FROM_EMAIL: z.string().email().or(z.literal("")).default(""),
    MAIL_FROM_NAME: z.string().default("BabyCentre Baby Shop"),
  })
  .passthrough(); // ← CRITICAL: keep any other env keys in the output

export function validateEnv(raw: Record<string, unknown>) {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(result.error.flatten().fieldErrors);
    throw new Error("Environment validation failed");
  }
  return result.data;
}
