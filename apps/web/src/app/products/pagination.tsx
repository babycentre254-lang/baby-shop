"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  // Build page numbers with ellipsis
  const pages: (number | "…")[] = [];
  const show = (n: number | "…") => pages.push(n);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) show(i);
  } else {
    show(1);
    if (page > 3) show("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      show(i);
    }
    if (page < totalPages - 2) show("…");
    show(totalPages);
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 mt-10"
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="h-10 w-10 rounded-xl border-2 border-cream-300 bg-white text-ink-700 flex items-center justify-center hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={i} className="px-2 text-ink-400">
            …
          </span>
        ) : (
          <button
            key={i}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "h-10 min-w-10 px-3 rounded-xl border-2 text-sm font-medium transition-colors",
              p === page
                ? "bg-blue-500 border-blue-500 text-white"
                : "bg-white border-cream-300 text-ink-700 hover:border-blue-300"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className="h-10 w-10 rounded-xl border-2 border-cream-300 bg-white text-ink-700 flex items-center justify-center hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}