"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, type FormEvent } from "react";

export function MobileSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  // Autofocus + lock body scroll when open
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    setOpen(false);
    if (!trimmed) {
      router.push("/products");
      return;
    }
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-ink-700 hover:text-blue-500 transition-colors"
      >
        <Search className="h-6 w-6" />
        <span className="hidden xs:block text-[10px] font-medium">Search</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 p-3 border-b border-cream-200"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for baby products..."
                aria-label="Search products"
                className="w-full h-11 rounded-full border-2 border-ink-200 bg-cream-50 pl-4 pr-4 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              aria-label="Submit search"
              className="h-11 w-11 shrink-0 rounded-full bg-pink-500 text-white flex items-center justify-center"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close search"
              className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-ink-600"
            >
              <X className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
