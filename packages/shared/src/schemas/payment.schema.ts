import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId");

/**
 * Phone must be 2547XXXXXXXX or 2541XXXXXXXX (Safaricom format).
 * We accept common Kenyan formats and normalize.
 */
export const mpesaPhoneSchema = z
  .string()
  .trim()
  .transform((v) => {
    const cleaned = v.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+254")) return cleaned.slice(1); // +254 → 254
    if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
    if (cleaned.startsWith("254")) return cleaned;
    if (cleaned.startsWith("7") || cleaned.startsWith("1"))
      return `254${cleaned}`;
    return cleaned;
  })
  .refine((v) => /^254[17]\d{8}$/.test(v), {
    message: "Enter a valid Safaricom number (2547XXXXXXXX or 2541XXXXXXXX)",
  });

export const initiateMpesaPaymentSchema = z.union([
  z.object({ sessionId: objectId, orderId: z.undefined().optional(), phone: mpesaPhoneSchema }),
  z.object({ orderId: objectId, sessionId: z.undefined().optional(), phone: mpesaPhoneSchema }),
]);

export type InitiateMpesaPaymentInput = z.infer<
  typeof initiateMpesaPaymentSchema
>;

/**
 * Shape of the M-Pesa callback body.
 * Safaricom sends this to our callback URL after the customer acts.
 */
export const mpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            })
          ),
        })
        .optional(),
    }),
  }),
});

export type MpesaCallbackPayload = z.infer<typeof mpesaCallbackSchema>;
