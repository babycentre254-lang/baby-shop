import { z } from "zod";
import { ADMIN_PERMISSION_SET, ADMIN_PERMISSIONS } from "@baby-shop/shared";
const permissionSchema = z.string().refine((permission) => ADMIN_PERMISSION_SET.has(permission), "Unknown permission");

export const listAdminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  verified: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});
export const analyticsRangeSchema = z.coerce.number().int().refine((days) => [7, 30, 90].includes(days), "Range must be 7, 30, or 90 days").default(30);
export const createBranchSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().min(2).max(20).regex(/^[a-zA-Z0-9-]+$/),
  address: z.string().trim().min(1).max(250),
  city: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().email().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});
export const updateBranchSchema = createBranchSchema.partial();
export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(100),
  currency: z.string().trim().length(3).transform((s) => s.toUpperCase()),
  timezone: z.string().trim().min(1).max(80),
  supportEmail: z.string().email().or(z.literal("")),
  supportPhone: z.string().trim().max(40),
  lowStockThreshold: z.number().int().min(0).max(10000),
  maintenanceMode: z.boolean(),
  cashOnDeliveryEnabled: z.boolean().default(true),
});
const draftItemSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  productName: z.string().trim().min(1).max(150),
  sku: z.string().trim().max(80).optional(),
  quantity: z.number().int().min(1).max(10000),
  unitPrice: z.number().min(0).max(100000000),
});
export const draftOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(150),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().trim().max(40).optional(),
  items: z.array(draftItemSchema).min(1).max(100),
  notes: z.string().trim().max(2000).optional(),
});
export const adminSaleSchema = z.object({
  customerName: z.string().trim().min(1).max(150),
  customerPhone: z.string().trim().max(40).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH", "MPESA"]),
  items: z.array(z.object({ variantId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().int().min(1).max(1000) })).min(1).max(100),
  notes: z.string().trim().max(1000).optional(),
}).superRefine((sale, ctx) => {
  if (sale.paymentMethod === "MPESA" && (sale.customerPhone?.replace(/\D/g, "").length ?? 0) < 9) ctx.addIssue({ code: "custom", path: ["customerPhone"], message: "Enter a valid phone number for the M-Pesa prompt." });
});
export const staffSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(10).max(128),
  permissions: z.array(permissionSchema).min(1).max(ADMIN_PERMISSIONS.length).transform((permissions) => [...new Set(permissions)]),
});
export const updateStaffAccessSchema = z.object({
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).optional(),
  permissions: z.array(permissionSchema).max(ADMIN_PERMISSIONS.length).transform((permissions) => [...new Set(permissions)]).optional(),
}).refine((value) => value.role !== undefined || value.permissions !== undefined, "Select a role or permission");

