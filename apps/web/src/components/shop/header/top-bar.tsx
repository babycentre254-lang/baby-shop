"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Truck,
  User,
  Sparkles,
  Heart,
  ShieldCheck,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  icon: typeof Sparkles;
  text: React.ReactNode;
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    icon: Truck,
    text: (
      <>
        Same-day delivery in <strong className="font-semibold">Nairobi</strong>
      </>
    ),
  },
  {
    icon: Sparkles,
    text: (
      <>
        New arrivals every <strong className="font-semibold">week</strong>
      </>
    ),
  },
  {
    icon: ShieldCheck,
    text: (
      <>
        <strong className="font-semibold">OEKO-TEX®</strong> certified materials
      </>
    ),
  },
  {
    icon: Heart,
    text: (
      <>
        Loved by <strong className="font-semibold">10,000+ parents</strong>
      </>
    ),
  },
  {
    icon: Gift,
    text: (
      <>
        Gift wrapping <strong className="font-semibold">available</strong>
      </>
    ),
  },
];

const ROTATE_INTERVAL_MS = 4500;

export function TopBar() {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      // Trigger fade-out
      setFading(true);

      // After fade, swap message + fade in
      const swapTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
        setFading(false);
      }, 250);

      return () => clearTimeout(swapTimer);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  const current = ANNOUNCEMENTS[index];
  const Icon = current.icon;

  return (
    <div className="w-full bg-blue-500 text-white text-xs md:text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-10 items-center justify-between gap-4">
        {/* ─── Left: rotating announcement ─── */}
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 shrink-0" />
          <span
            className={cn(
              "truncate transition-opacity duration-250",
              fading ? "opacity-0" : "opacity-100"
            )}
          >
            {current.text}
          </span>
        </div>

        {/* ─── Right: help links ─── */}
        <div className="hidden md:flex items-center gap-6 shrink-0">
          <Link
            href="/track"
            className="hover:text-pink-200 transition-colors"
          >
            Track Order
          </Link>
          <Link
            href="/help"
            className="hover:text-pink-200 transition-colors"
          >
            Help
          </Link>
          <Link
            href="/account/orders"
            className="flex items-center gap-1.5 hover:text-pink-200 transition-colors"
          >
            <User className="h-4 w-4" />
            My Account
          </Link>
        </div>
      </div>
    </div>
  );
}