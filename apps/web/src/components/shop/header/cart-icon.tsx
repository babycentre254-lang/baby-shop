"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cartApi } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

interface Props {
  isAuthenticated: boolean;
}

export function CartIcon({ isAuthenticated }: Props) {
  const { data } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.get(),
    enabled: isAuthenticated,
    staleTime: 10_000,
  });

  const count = data?.cart?.itemCount ?? 0;

  return (
    <Link
      href="/cart"
      aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
      className="relative flex flex-col items-center justify-center gap-0.5 px-2 md:px-3 py-2 text-ink-700 hover:text-blue-500 transition-colors group"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6 md:h-7 md:w-7 group-hover:scale-110 transition-transform" />
        {count > 0 && (
          <span
            className={cn(
              "absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full",
              "bg-pink-500 text-white text-[10px] font-bold",
              "flex items-center justify-center"
            )}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>
      <span className="hidden md:block text-[11px] font-medium">Cart</span>
    </Link>
  );
}
