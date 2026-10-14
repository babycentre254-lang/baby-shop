import type { Paginated } from "@baby-shop/shared";

export interface BuildPaginatedArgs<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function buildPaginated<T>({
  items,
  total,
  page,
  pageSize,
}: BuildPaginatedArgs<T>): Paginated<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function parseSort(sort: string): Record<string, 1 | -1> {
  if (sort.startsWith("-")) return { [sort.slice(1)]: -1 };
  return { [sort]: 1 };
}