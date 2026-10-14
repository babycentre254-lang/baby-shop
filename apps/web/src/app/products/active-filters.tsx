"use client";

import { X } from "lucide-react";
import { formatKES } from "@/lib/utils";
import type { FilterValues } from "./filters-sidebar";

interface Props {
  values: FilterValues;
  categories: { slug: string; name: string }[];
  brands: { slug: string; name: string }[];
  onChange: (patch: Partial<FilterValues>) => void;
}

export function ActiveFilters({
  values,
  categories,
  brands,
  onChange,
}: Props) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (values.category) {
    const name =
      categories.find((c) => c.slug === values.category)?.name ??
      values.category;
    chips.push({ label: name, onRemove: () => onChange({ category: "" }) });
  }

  if (values.brand) {
    const name =
      brands.find((b) => b.slug === values.brand)?.name ?? values.brand;
    chips.push({ label: name, onRemove: () => onChange({ brand: "" }) });
  }

  if (values.minPrice || values.maxPrice) {
    const label =
      values.minPrice && values.maxPrice
        ? `${formatKES(values.minPrice)} – ${formatKES(values.maxPrice)}`
        : values.minPrice
        ? `From ${formatKES(values.minPrice)}`
        : `Up to ${formatKES(values.maxPrice!)}`;
    chips.push({
      label,
      onRemove: () => onChange({ minPrice: null, maxPrice: null }),
    });
  }

  if (values.ageRange) {
    chips.push({
      label: values.ageRange,
      onRemove: () => onChange({ ageRange: "" }),
    });
  }

  if (values.inStock) {
    chips.push({
      label: "In stock only",
      onRemove: () => onChange({ inStock: false }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="h-5 w-5 rounded-full hover:bg-blue-200 flex items-center justify-center"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}