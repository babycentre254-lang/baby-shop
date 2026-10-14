import { z } from "zod";
import { paginationQuerySchema } from "./pagination.schema";
import { ORDER_STATUS_VALUES } from "../constants/order-status";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId");

export const checkoutSchema = z.object({
  addressId: objectId,
  paymentProvider: z.enum(["MPESA", "COD"]).default("COD"),
  notes: z.string().trim().max(500).optional(),
  expectedShippingFee: z.number().int().min(0).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES as [string, ...string[]]),
  note: z.string().trim().max(300).optional(),
});

export const listOrdersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ORDER_STATUS_VALUES as [string, ...string[]]).optional(),
  userId: objectId.optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;