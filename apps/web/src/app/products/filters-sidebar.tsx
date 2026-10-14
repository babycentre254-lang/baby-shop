"use client";

import { useState } from "react";
import {
  ChevronDown,
  X,
  Layers,
  Award,
  DollarSign,
  Baby,
  PackageCheck,
  SlidersHorizontal,
  Check,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterValues {
  category: string;
  brand: string;
  minPrice: number | null;
  maxPrice: number | null;
  ageRange: string;
  inStock: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}
interface Brand {
  _id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
  brands: Brand[];
  values: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  onClear: () => void;
}

const AGE_RANGES = [
  "Newborn",
  "0-3M",
  "3-6M",
  "6-9M",
  "9-12M",
  "12-18M",
  "18-24M",
];

const PRICE_PRESETS = [
  { label: "Under 500", min: null, max: 500 },
  { label: "500 – 2K", min: 500, max: 2000 },
  { label: "2K – 5K", min: 2000, max: 5000 },
  { label: "5K+", min: 5000, max: null },
] as const;

export function FiltersSidebar({
  categories,
  brands,
  values,
  onChange,
  onClear,
}: Props) {
  const [brandQuery, setBrandQuery] = useState("");
  const activeCount = [
    values.category,
    values.brand,
    values.minPrice || values.maxPrice,
    values.ageRange,
    values.inStock,
  ].filter(Boolean).length;

  const hasAny = activeCount > 0;

  return (
    <div>
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-ink-400" />
          <h2 className="text-[11px] font-semibold text-ink-800 uppercase tracking-[0.08em]">
            Filters
          </h2>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {hasAny && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-pink-500 hover:text-pink-600 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* ═══ Sections ═══ */}
      <div className="space-y-1">
        {/* Category */}
        <Section
          icon={<Layers className="h-3.5 w-3.5" />}
          title="Category"
          defaultOpen
          active={!!values.category}
        >
          <div className="space-y-0.5 max-h-64 overflow-y-auto scroll-fade pb-1">
            <FilterRadio
              label="All categories"
              checked={!values.category}
              onChange={() => onChange({ category: "" })}
            />
            {categories.map((c) => (
              <FilterRadio
                key={c._id}
                label={c.name}
                checked={values.category === c.slug}
                onChange={() =>
                  onChange({
                    category: values.category === c.slug ? "" : c.slug,
                  })
                }
              />
            ))}
          </div>
        </Section>

        {/* Brand */}
        {brands.length > 0 && (
          <Section
            icon={<Award className="h-3.5 w-3.5" />}
            title="Brand"
            defaultOpen
            active={!!values.brand}
          >
            <label className="mb-2 flex h-8 items-center gap-2 rounded-full border border-cream-300 px-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <Search className="h-3.5 w-3.5 shrink-0 text-ink-400" />
              <input
                type="search"
                value={brandQuery}
                onChange={(event) => setBrandQuery(event.target.value)}
                placeholder="Search brands"
                aria-label="Search brands"
                className="min-w-0 flex-1 bg-transparent text-xs text-ink-800 outline-none placeholder:text-ink-400"
              />
            </label>
            <div className="max-h-52 space-y-0.5 overflow-y-auto scroll-fade pb-1">
              <FilterRadio
                label="All brands"
                checked={!values.brand}
                onChange={() => onChange({ brand: "" })}
              />
              {brands
                .filter((brand) =>
                  brand.name.toLowerCase().includes(brandQuery.trim().toLowerCase())
                )
                .map((b) => (
                <FilterRadio
                  key={b._id}
                  label={b.name}
                  checked={values.brand === b.slug}
                  onChange={() =>
                    onChange({
                      brand: values.brand === b.slug ? "" : b.slug,
                    })
                  }
                />
              ))}
            </div>
          </Section>
        )}

        {/* Price */}
        <Section
          icon={<DollarSign className="h-3.5 w-3.5" />}
          title="Price"
          defaultOpen
          active={!!(values.minPrice || values.maxPrice)}
        >
          <PriceFilter
            min={values.minPrice}
            max={values.maxPrice}
            onChange={(min, max) =>
              onChange({ minPrice: min, maxPrice: max })
            }
          />
        </Section>

        {/* Age range */}
        <Section
          icon={<Baby className="h-3.5 w-3.5" />}
          title="Age range"
          active={!!values.ageRange}
        >
          <div className="flex flex-wrap gap-1.5">
            {AGE_RANGES.map((age) => {
              const selected = values.ageRange === age;
              return (
                <button
                  key={age}
                  onClick={() =>
                    onChange({
                      ageRange: selected ? "" : age,
                    })
                  }
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-all",
                    selected
                      ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                      : "bg-white text-ink-600 border-cream-300 hover:border-blue-300 hover:text-blue-600"
                  )}
                >
                  {selected && <Check className="h-2.5 w-2.5" />}
                  {age}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Availability */}
        <Section
          icon={<PackageCheck className="h-3.5 w-3.5" />}
          title="Availability"
          active={values.inStock}
        >
          <label className="flex items-center justify-between cursor-pointer group py-0.5">
            <span
              className={cn(
                "text-sm transition-colors",
                values.inStock
                  ? "text-ink-900 font-medium"
                  : "text-ink-600 group-hover:text-ink-900"
              )}
            >
              In stock only
            </span>
            <div
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors shrink-0",
                values.inStock ? "bg-blue-500" : "bg-ink-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                  values.inStock ? "translate-x-[18px]" : "translate-x-0.5"
                )}
              />
            </div>
            <input
              type="checkbox"
              checked={values.inStock}
              onChange={(e) => onChange({ inStock: e.target.checked })}
              className="sr-only"
            />
          </label>
        </Section>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Section
// ═══════════════════════════════════════════════════════════

function Section({
  icon,
  title,
  children,
  defaultOpen = false,
  active = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  active?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-cream-200 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 py-2.5 text-left group"
      >
        <span
          className={cn(
            "shrink-0 transition-colors",
            active ? "text-blue-500" : "text-ink-400 group-hover:text-ink-600"
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "flex-1 text-[13px] transition-colors",
            active
              ? "text-ink-900 font-medium"
              : "text-ink-700 group-hover:text-ink-900"
          )}
        >
          {title}
        </span>
        {active && (
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-ink-400 transition-transform shrink-0",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="pb-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FilterRadio
// ═══════════════════════════════════════════════════════════

function FilterRadio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors",
        checked ? "bg-blue-50" : "hover:bg-cream-50"
      )}
    >
      <div
        className={cn(
          "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
          checked
            ? "border-blue-500 bg-blue-500"
            : "border-ink-300 bg-white"
        )}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>
      <span
        className={cn(
          "truncate text-xs transition-colors",
          checked ? "text-ink-900 font-medium" : "text-ink-600"
        )}
      >
        {label}
      </span>
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
    </label>
  );
}

// ═══════════════════════════════════════════════════════════
// PriceFilter
// ═══════════════════════════════════════════════════════════

function PriceFilter({
  min,
  max,
  onChange,
}: {
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const [localMin, setLocalMin] = useState(min?.toString() ?? "");
  const [localMax, setLocalMax] = useState(max?.toString() ?? "");

  function apply() {
    onChange(
      localMin ? Number(localMin) : null,
      localMax ? Number(localMax) : null
    );
  }

  const isDirty =
    (localMin || "") !== (min?.toString() ?? "") ||
    (localMax || "") !== (max?.toString() ?? "");

  return (
    <div className="space-y-3">
      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRICE_PRESETS.map((p) => {
          const selected =
            (p.min === min || (p.min === null && min === null)) &&
            (p.max === max || (p.max === null && max === null));
          return (
            <button
              key={p.label}
              onClick={() => {
                setLocalMin(p.min?.toString() ?? "");
                setLocalMax(p.max?.toString() ?? "");
                onChange(p.min, p.max);
              }}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border transition-all whitespace-nowrap",
                selected
                  ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                  : "bg-white text-ink-600 border-cream-300 hover:border-blue-300 hover:text-blue-600"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 h-px bg-cream-200" />
        <span className="text-[10px] text-ink-400 uppercase tracking-wider">
          or custom
        </span>
        <div className="flex-1 h-px bg-cream-200" />
      </div>

      {/* Custom inputs */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-400 font-medium">
            KSh
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            placeholder="Min"
            className="w-full h-9 rounded-lg border border-cream-300 bg-white pl-9 pr-2 text-xs focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <span className="text-ink-300 text-xs">—</span>
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-400 font-medium">
            KSh
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            placeholder="Max"
            className="w-full h-9 rounded-lg border border-cream-300 bg-white pl-9 pr-2 text-xs focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <button
        onClick={apply}
        disabled={!isDirty}
        className={cn(
          "w-full h-9 rounded-lg text-xs font-semibold transition-all",
          isDirty
            ? "bg-blue-500 hover:bg-blue-600 text-white"
            : "bg-cream-100 text-ink-400 cursor-not-allowed"
        )}
      >
        Apply range
      </button>
    </div>
  );
}
