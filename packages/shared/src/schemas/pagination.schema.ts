import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .string()
    .regex(/^-?[a-zA-Z0-9_]+$/, "Sort must be a field name optionally prefixed with -")
    .default("-createdAt"),
  search: z.string().trim().min(1).max(100).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;