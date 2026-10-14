"use client";

import { useQuery } from "@tanstack/react-query";
import { shippingApi } from "@/lib/api/endpoints";
import type { ShippingQuote } from "@baby-shop/shared";

export function useShippingQuote(
  county: string | null,
  totalWeightGrams: number,
  enabled = true
) {
  return useQuery({
    queryKey: ["shipping-quote", county, totalWeightGrams],
    queryFn: () =>
      shippingApi.quote({
        county: county!,
        totalWeightGrams,
      }),
    enabled: enabled && !!county && totalWeightGrams >= 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}