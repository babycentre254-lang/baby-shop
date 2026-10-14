"use client";

import { cn } from "@/lib/utils";

interface Props {
  label: string;
  children: React.ReactNode;
  side?: "right" | "top";
}

export function Tooltip({ label, children, side = "right" }: Props) {
  return (
    <div className="relative group/tip inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-ink-800 text-white text-xs font-medium px-2.5 py-1.5 shadow-lg",
          "opacity-0 scale-95 group-hover/tip:opacity-100 group-hover/tip:scale-100",
          "transition-all duration-150",
          side === "right" && "left-full ml-2 top-1/2 -translate-y-1/2",
          side === "top" && "bottom-full mb-2 left-1/2 -translate-x-1/2"
        )}
      >
        {label}
      </span>
    </div>
  );
}