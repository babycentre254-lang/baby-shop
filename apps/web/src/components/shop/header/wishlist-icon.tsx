"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

interface Props {
  isAuthenticated: boolean;
}

export function WishlistIcon({ isAuthenticated }: Props) {
  return (
    <Link
      href={isAuthenticated ? "/account/wishlist" : "/login?next=/account/wishlist"}
      aria-label="Wishlist"
      className="relative flex flex-col items-center justify-center gap-0.5 px-2 md:px-3 py-2 text-ink-700 hover:text-pink-500 transition-colors group"
    >
      <Heart className="h-6 w-6 md:h-7 md:w-7 group-hover:scale-110 transition-transform" />
      <span className="hidden md:block text-[11px] font-medium">Wishlist</span>
    </Link>
  );
}
