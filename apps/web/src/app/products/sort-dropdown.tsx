"use client";

import { ChevronDown } from "lucide-react";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: Low to high" },
  { value: "price-desc", label: "Price: High to low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

interface Props {
  value: SortValue;
  onChange: (v: SortValue) => void;
}

export function SortDropdown({ value, onChange }: Props) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="h-9 cursor-pointer appearance-none rounded-lg border border-cream-300 bg-white pl-3 pr-9 text-xs text-ink-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
    </div>
  );
}
