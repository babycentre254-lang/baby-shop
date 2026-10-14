"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/products");
      return;
    }
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full group" role="search">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for baby products..."
        aria-label="Search products"
        className="w-full h-11 md:h-12 rounded-full border-2 border-ink-200 bg-white pl-4 pr-14 text-sm text-ink-800 placeholder:text-ink-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 md:h-10 md:w-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center transition-colors"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}
