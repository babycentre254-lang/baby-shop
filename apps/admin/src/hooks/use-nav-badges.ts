"use client";

import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/endpoints";

export function useNavBadges(canViewOrders = true) {
  const ordersQ = useQuery({
    queryKey: ["admin", "orders", "pending-count"],
    enabled: canViewOrders,
    queryFn: async () => {
      try {
        const res = await ordersApi.listAll({ status: "PENDING", pageSize: 1 });
        return res.total ?? 0;
      } catch {
        // Endpoint not yet built, or auth issue — silently return 0
        return 0;
      }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false, // don't hammer a broken endpoint
    throwOnError: false, // never crash the sidebar
  });

  return {
    orders: canViewOrders ? ordersQ.data ?? 0 : 0,
    lowStock: 0,
  };
}
