"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints";

export interface SessionUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function useSession() {
  const q = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const res = await authApi.me();
        return res.user as SessionUser;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  return {
    user: q.data ?? null,
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}