"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  X,
  Wand2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Search,
  Undo2,
  RefreshCw,
  CheckSquare,
  Square,
  AlertCircle,
  DollarSign,
  Boxes,
  Layers,
  Sparkles,
  Table2,
  Rows3,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface VariantDraft {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  lowStockAt: number;
}

export interface AttributeState {
  sizes: string[];
  colors: string[];
}

interface Props {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
  /** Lifted attribute state — persists across tab switches */
  attributes: AttributeState;
  onAttributesChange: (attrs: AttributeState) => void;
  basePrice: number;
  productName: string;
}

// ═══════════════════════════════════════════════════════════
// Presets & constants
// ═══════════════════════════════════════════════════════════

const SIZE_PRESETS = [
  { label: "Newborn basics", sizes: ["Newborn", "0-3M", "3-6M", "6-9M"] },
  { label: "Toddler", sizes: ["12-18M", "18-24M", "2T", "3T"] },
  { label: "One-size", sizes: ["One-size"] },
] as const;

const COLOR_PRESETS = [
  { label: "Neutrals", colors: ["Cream", "White", "Grey", "Teddy"] },
  { label: "Pastels", colors: ["Blush", "Sage", "Sky", "Butter"] },
  { label: "Classic", colors: ["Blue", "Pink", "Navy", "Black"] },
] as const;

const COMMON_SIZES = [
  "Newborn",
  "0-3M",
  "3-6M",
  "6-9M",
  "9-12M",
  "12-18M",
  "18-24M",
  "2T",
  "3T",
];

const COMMON_COLORS = [
  "White",
  "Cream",
  "Blue",
  "Navy",
  "Pink",
  "Blush",
  "Sage",
  "Grey",
  "Teddy",
  "Black",
];

// Map color names to hex for the little swatch dots
const COLOR_HEX: Record<string, string> = {
  White: "#FFFFFF",
  Cream: "#FFF7EC",
  Blue: "#0090D8",
  Navy: "#002B44",
  Sky: "#8DD6F2",
  Pink: "#F0417E",
  Blush: "#FBB6CB",
  Sage: "#9EBB96",
  Grey: "#A6B0BC",
  Teddy: "#C68C53",
  Black: "#121110",
  Butter: "#FFE066",
};

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function slugifySku(name: string, size: string, color: string): string {
  const base = [name, size, color]
    .filter(Boolean)
    .join(" ")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .split("-")
    .filter(Boolean)
    .map((p) => p.slice(0, 4))
    .join("-");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suffix}`.slice(0, 50);
}

function clone(v: VariantDraft): VariantDraft {
  return { ...v, id: crypto.randomUUID(), sku: `${v.sku}-C` };
}

// ═══════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════

export function VariantMatrix({
  variants,
  onChange,
  attributes,
  onAttributesChange,
  basePrice,
  productName,
}: Props) {
  const { sizes, colors } = attributes;

  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable"
  );
  const [undoStack, setUndoStack] = useState<VariantDraft[][]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkField, setBulkField] = useState<"stock" | "price" | "lowStockAt">(
    "stock"
  );
  const [bulkValue, setBulkValue] = useState("");

  // Keep previous variants for undo
  const prevVariantsRef = useRef<VariantDraft[]>(variants);

  // ─── Change wrapper: pushes to undo stack ────────────────
  function commit(next: VariantDraft[]) {
    setUndoStack((stack) => [...stack.slice(-19), prevVariantsRef.current]);
    prevVariantsRef.current = next;
    onChange(next);
  }

  function undo() {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const last = stack[stack.length - 1];
      prevVariantsRef.current = last;
      onChange(last);
      return stack.slice(0, -1);
    });
  }

  // ─── Auto-sync base price on variants that are priced at 0 ─
  useEffect(() => {
    if (basePrice > 0) {
      const next = variants.map((v) => ({
        ...v,
        price: v.price === 0 ? basePrice : v.price,
      }));
      const changed = next.some((v, i) => v.price !== variants[i].price);
      if (changed) onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePrice]);

  // ─── Attribute handlers ─────────────────────────────────
  function addSize(s: string) {
    const v = s.trim();
    if (!v || sizes.includes(v)) return;
    onAttributesChange({ sizes: [...sizes, v], colors });
    setSizeInput("");
  }
  function addColor(c: string) {
    const v = c.trim();
    if (!v || colors.includes(v)) return;
    onAttributesChange({ sizes, colors: [...colors, v] });
    setColorInput("");
  }
  function removeSize(s: string) {
    onAttributesChange({ sizes: sizes.filter((x) => x !== s), colors });
  }
  function removeColor(c: string) {
    onAttributesChange({ sizes, colors: colors.filter((x) => x !== c) });
  }

  // ─── Matrix generation ──────────────────────────────────
  function generateMatrix() {
    if (sizes.length === 0 && colors.length === 0) return;
    const effectiveSizes = sizes.length ? sizes : [""];
    const effectiveColors = colors.length ? colors : [""];

    const next: VariantDraft[] = [];
    for (const size of effectiveSizes) {
      for (const color of effectiveColors) {
        const existing = variants.find(
          (v) => v.size === size && v.color === color
        );
        next.push(
          existing ?? {
            id: crypto.randomUUID(),
            sku: slugifySku(productName, size, color),
            size,
            color,
            price: basePrice || 0,
            stock: 0,
            lowStockAt: 5,
          }
        );
      }
    }
    commit(next);
  }

  // ─── Variant updates ────────────────────────────────────
  function updateVariant(id: string, patch: Partial<VariantDraft>) {
    commit(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function removeVariant(id: string) {
    commit(variants.filter((v) => v.id !== id));
    setSelected((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }

  function duplicateVariant(id: string) {
    const idx = variants.findIndex((v) => v.id === id);
    if (idx < 0) return;
    const next = [...variants];
    next.splice(idx + 1, 0, clone(variants[idx]));
    commit(next);
  }

  function moveUp(id: string) {
    const idx = variants.findIndex((v) => v.id === id);
    if (idx <= 0) return;
    const next = [...variants];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    commit(next);
  }

  function moveDown(id: string) {
    const idx = variants.findIndex((v) => v.id === id);
    if (idx < 0 || idx >= variants.length - 1) return;
    const next = [...variants];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    commit(next);
  }

  function addBlankVariant() {
    commit([
      ...variants,
      {
        id: crypto.randomUUID(),
        sku: slugifySku(productName, "", ""),
        size: "",
        color: "",
        price: basePrice || 0,
        stock: 0,
        lowStockAt: 5,
      },
    ]);
  }

  function regenerateSku(id: string) {
    const v = variants.find((x) => x.id === id);
    if (!v) return;
    updateVariant(id, { sku: slugifySku(productName, v.size, v.color) });
  }

  function regenerateAllSkus() {
    commit(
      variants.map((v) => ({
        ...v,
        sku: slugifySku(productName, v.size, v.color),
      }))
    );
  }

  // ─── Bulk operations ────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filteredVariants.length) setSelected(new Set());
    else setSelected(new Set(filteredVariants.map((v) => v.id)));
  }

  function bulkDelete() {
    commit(variants.filter((v) => !selected.has(v.id)));
    setSelected(new Set());
  }

  function applyBulk() {
    const num = Number(bulkValue);
    if (Number.isNaN(num)) return;
    commit(
      variants.map((v) =>
        selected.has(v.id) ? { ...v, [bulkField]: Math.max(0, num) } : v
      )
    );
    setBulkValue("");
    setBulkOpen(false);
    setSelected(new Set());
  }

  // ─── Search ─────────────────────────────────────────────
  const filteredVariants = useMemo(() => {
    if (!search.trim()) return variants;
    const q = search.toLowerCase();
    return variants.filter(
      (v) =>
        v.sku.toLowerCase().includes(q) ||
        v.size.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q)
    );
  }, [variants, search]);

  // ─── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalStock = variants.reduce((s, v) => s + (v.stock || 0), 0);
    const totalValue = variants.reduce(
      (s, v) => s + (v.stock || 0) * (v.price || 0),
      0
    );
    const lowStock = variants.filter(
      (v) => v.stock > 0 && v.stock <= v.lowStockAt
    ).length;
    const outOfStock = variants.filter((v) => v.stock === 0).length;
    const dupSkus = (() => {
      const seen = new Map<string, number>();
      variants.forEach((v) =>
        seen.set(v.sku, (seen.get(v.sku) ?? 0) + 1)
      );
      return [...seen.values()].filter((c) => c > 1).length;
    })();
    const zeroPrice = variants.filter((v) => v.price <= 0).length;

    return { totalStock, totalValue, lowStock, outOfStock, dupSkus, zeroPrice };
  }, [variants]);

  const issues: string[] = [];
  if (stats.dupSkus > 0) issues.push(`${stats.dupSkus} duplicate SKU(s)`);
  if (stats.zeroPrice > 0) issues.push(`${stats.zeroPrice} variant(s) priced at 0`);
  if (stats.outOfStock > 0) issues.push(`${stats.outOfStock} out of stock`);

  const allSelected =
    filteredVariants.length > 0 && selected.size === filteredVariants.length;

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="space-y-5">
      {/* ─── Attributes builder ─── */}
      <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-cream-200 bg-cream-50">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-ink-800">
              Attributes
            </span>
          </div>
          {undoStack.length > 0 && (
            <button
              type="button"
              onClick={undo}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs text-ink-600 hover:bg-white hover:text-ink-900 transition-colors"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
          )}
        </div>

        <div className="p-4 space-y-5">
          {/* ─── Sizes ─── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ink-700">
                Sizes
              </label>
              <div className="flex items-center gap-1">
                {SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onAttributesChange({
                        sizes: [
                          ...new Set([...sizes, ...preset.sizes]),
                        ],
                        colors,
                      })
                    }
                    className="text-[10px] px-2 py-1 rounded-md text-ink-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSize(s)}
                    className="h-5 w-5 rounded-full hover:bg-blue-200 flex items-center justify-center"
                    aria-label={`Remove ${s}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSize(sizeInput);
                    }
                  }}
                  placeholder="Add size"
                  className="h-8 w-24 rounded-full border-2 border-ink-200 bg-white px-3 text-xs focus:border-blue-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addSize(sizeInput)}
                  className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                  aria-label="Add size"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_SIZES.filter((s) => !sizes.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSize(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-ink-200 text-ink-500 hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Colors ─── */}
          <div className="space-y-3 pt-2 border-t border-cream-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ink-700">
                Colors
              </label>
              <div className="flex items-center gap-1">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onAttributesChange({
                        sizes,
                        colors: [
                          ...new Set([...colors, ...preset.colors]),
                        ],
                      })
                    }
                    className="text-[10px] px-2 py-1 rounded-md text-ink-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1.5 rounded-full bg-pink-50 text-pink-700 text-xs font-medium border border-pink-200"
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white/60 shrink-0"
                    style={{
                      backgroundColor: COLOR_HEX[c] ?? "#E5E7EB",
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
                    }}
                  />
                  {c}
                  <button
                    type="button"
                    onClick={() => removeColor(c)}
                    className="h-5 w-5 rounded-full hover:bg-pink-200 flex items-center justify-center"
                    aria-label={`Remove ${c}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addColor(colorInput);
                    }
                  }}
                  placeholder="Add color"
                  className="h-8 w-24 rounded-full border-2 border-ink-200 bg-white px-3 text-xs focus:border-pink-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addColor(colorInput)}
                  className="h-8 w-8 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600"
                  aria-label="Add color"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_COLORS.filter((c) => !colors.includes(c)).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => addColor(c)}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-ink-200 text-ink-500 hover:border-pink-300 hover:text-pink-500 transition-colors"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLOR_HEX[c] ?? "#E5E7EB" }}
                  />
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Generate ─── */}
          {(sizes.length > 0 || colors.length > 0) && (
            <div className="pt-3 border-t border-cream-200 flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-ink-500">
                {sizes.length || 1} size{(sizes.length || 1) !== 1 ? "s" : ""} ×{" "}
                {colors.length || 1} color
                {(colors.length || 1) !== 1 ? "s" : ""} ={" "}
                <strong className="text-ink-800">
                  {(sizes.length || 1) * (colors.length || 1)}
                </strong>{" "}
                combinations
              </p>
              <button
                type="button"
                onClick={generateMatrix}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Wand2 className="h-4 w-4" />
                Generate variants
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stats bar ─── */}
      {variants.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Layers className="h-4 w-4" />}
            label="Variants"
            value={String(variants.length)}
            tone="blue"
          />
          <StatCard
            icon={<Boxes className="h-4 w-4" />}
            label="Total stock"
            value={`${stats.totalStock} units`}
            tone={stats.outOfStock > 0 ? "yellow" : "sage"}
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Inventory value"
            value={`KSh ${stats.totalValue.toLocaleString("en-KE")}`}
            tone="pink"
          />
          <StatCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Low stock"
            value={String(stats.lowStock)}
            tone={stats.lowStock > 0 ? "yellow" : "sage"}
          />
        </div>
      )}

      {/* ─── Warnings ─── */}
      {issues.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border-2 border-yellow-200 bg-yellow-50 px-3 py-2.5 text-xs text-yellow-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <strong className="block mb-0.5">Things to fix</strong>
            <ul className="list-disc list-inside space-y-0.5">
              {issues.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ─── Toolbar ─── */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search variants by SKU, size, color…"
                className="w-full h-9 rounded-lg border-2 border-ink-200 bg-white pl-9 pr-3 text-xs focus:border-blue-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={regenerateAllSkus}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border-2 border-ink-200 bg-white text-xs font-medium text-ink-700 hover:bg-cream-100 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regen all SKUs
            </button>

            <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg border-2 border-ink-200 bg-white">
              <button
                type="button"
                onClick={() => setDensity("comfortable")}
                className={cn(
                  "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
                  density === "comfortable"
                    ? "bg-ink-900 text-white"
                    : "text-ink-500 hover:bg-cream-100"
                )}
                aria-label="Comfortable"
              >
                <Rows3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDensity("compact")}
                className={cn(
                  "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
                  density === "compact"
                    ? "bg-ink-900 text-white"
                    : "text-ink-500 hover:bg-cream-100"
                )}
                aria-label="Compact"
              >
                <Table2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2.5">
              <span className="text-sm text-blue-800">
                <strong>{selected.size}</strong> selected
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setBulkOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Bulk edit
                </button>
                <button
                  type="button"
                  onClick={bulkDelete}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-blue-700 hover:text-blue-900"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {bulkOpen && selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-blue-300 bg-white px-4 py-3">
              <span className="text-xs font-medium text-ink-700">
                Set
              </span>
              <select
                value={bulkField}
                onChange={(e) => setBulkField(e.target.value as any)}
                className="h-9 rounded-lg border-2 border-ink-200 bg-white px-2 text-xs focus:border-blue-400 focus:outline-none"
              >
                <option value="stock">Stock</option>
                <option value="price">Price</option>
                <option value="lowStockAt">Low stock at</option>
              </select>
              <span className="text-xs text-ink-500">to</span>
              <input
                type="number"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder="Value"
                className="h-9 w-24 rounded-lg border-2 border-ink-200 bg-white px-2.5 text-xs focus:border-blue-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={applyBulk}
                disabled={!bulkValue}
                className="h-9 px-3 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                className="h-9 px-3 rounded-lg text-xs text-ink-500 hover:text-ink-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Variants table ─── */}
      {variants.length > 0 && (
        <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr className="text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className={cn("w-10", density === "compact" ? "px-2 py-1.5" : "px-3 py-2")}>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      aria-label="Select all"
                      className="text-ink-500 hover:text-blue-500"
                    >
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className={cn("font-semibold", density === "compact" ? "px-2 py-1.5" : "px-3 py-2")}>
                    Size
                  </th>
                  <th className={cn("font-semibold", density === "compact" ? "px-2 py-1.5" : "px-3 py-2")}>
                    Color
                  </th>
                  <th className={cn("font-semibold", density === "compact" ? "px-2 py-1.5" : "px-3 py-2")}>
                    SKU
                  </th>
                  <th className={cn("font-semibold w-28", density === "compact" ? "px-2 py-1.5" : "px-3 py-2")}>
                    Price
                  </th>
                  <th className={cn("font-semibold w-20", density === "compact" ? "px-2 py-1.5" : "px-3 py-2")}>
                    Stock
                  </th>
                  <th className={cn("font-semibold w-20", density === "compact" ? "px-2 py-1.5" : "px-3 py-2")}>
                    Low at
                  </th>
                  <th className={cn("w-32", density === "compact" ? "px-2 py-1.5" : "px-3 py-2")}></th>
                </tr>
              </thead>
              <tbody>
                {filteredVariants.map((v, i) => {
                  const isSelected = selected.has(v.id);
                  const rowPad = density === "compact" ? "px-2 py-1" : "px-3 py-2";
                  const inputH = density === "compact" ? "h-7" : "h-9";

                  return (
                    <tr
                      key={v.id}
                      className={cn(
                        "border-b border-cream-200 last:border-0 transition-colors",
                        isSelected ? "bg-blue-50/50" : "hover:bg-cream-50/60"
                      )}
                    >
                      <td className={rowPad}>
                        <button
                          type="button"
                          onClick={() => toggleSelect(v.id)}
                          aria-label="Select row"
                          className="text-ink-400 hover:text-blue-500"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className={rowPad}>
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) =>
                            updateVariant(v.id, { size: e.target.value })
                          }
                          placeholder="—"
                          className={cn(
                            "w-24 rounded-lg border border-cream-300 bg-white px-2 text-xs focus:border-blue-400 focus:outline-none",
                            inputH
                          )}
                        />
                      </td>
                      <td className={rowPad}>
                        <div className="flex items-center gap-1.5">
                          {v.color && (
                            <span
                              className="h-3.5 w-3.5 rounded-full shrink-0 border border-white shadow-sm"
                              style={{
                                backgroundColor:
                                  COLOR_HEX[v.color] ?? "#E5E7EB",
                              }}
                            />
                          )}
                          <input
                            type="text"
                            value={v.color}
                            onChange={(e) =>
                              updateVariant(v.id, { color: e.target.value })
                            }
                            placeholder="—"
                            className={cn(
                              "w-20 rounded-lg border border-cream-300 bg-white px-2 text-xs focus:border-blue-400 focus:outline-none",
                              inputH
                            )}
                          />
                        </div>
                      </td>
                      <td className={rowPad}>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) =>
                              updateVariant(v.id, { sku: e.target.value })
                            }
                            className={cn(
                              "w-full min-w-[140px] rounded-lg border border-cream-300 bg-white px-2 text-xs font-mono focus:border-blue-400 focus:outline-none",
                              inputH
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => regenerateSku(v.id)}
                            title="Regenerate SKU"
                            className="h-7 w-7 rounded-md text-ink-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center shrink-0"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className={rowPad}>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) =>
                            updateVariant(v.id, {
                              price: Number(e.target.value) || 0,
                            })
                          }
                          className={cn(
                            "w-24 rounded-lg border bg-white px-2 text-xs focus:border-blue-400 focus:outline-none",
                            v.price <= 0
                              ? "border-pink-300 text-pink-600"
                              : "border-cream-300",
                            inputH
                          )}
                        />
                      </td>
                      <td className={rowPad}>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(v.id, {
                              stock: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className={cn(
                            "w-20 rounded-lg border bg-white px-2 text-xs focus:border-blue-400 focus:outline-none",
                            v.stock === 0
                              ? "border-pink-300 text-pink-600"
                              : v.stock <= v.lowStockAt
                              ? "border-yellow-300 text-yellow-700"
                              : "border-cream-300 text-ink-900",
                            inputH
                          )}
                        />
                      </td>
                      <td className={rowPad}>
                        <input
                          type="number"
                          value={v.lowStockAt}
                          onChange={(e) =>
                            updateVariant(v.id, {
                              lowStockAt: Math.max(
                                0,
                                Number(e.target.value) || 0
                              ),
                            })
                          }
                          className={cn(
                            "w-20 rounded-lg border border-cream-300 bg-white px-2 text-xs focus:border-blue-400 focus:outline-none",
                            inputH
                          )}
                        />
                      </td>
                      <td className={rowPad}>
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveUp(v.id)}
                            disabled={i === 0}
                            aria-label="Move up"
                            className="h-7 w-7 rounded-md text-ink-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center disabled:opacity-30"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(v.id)}
                            disabled={i === filteredVariants.length - 1}
                            aria-label="Move down"
                            className="h-7 w-7 rounded-md text-ink-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center disabled:opacity-30"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateVariant(v.id)}
                            aria-label="Duplicate"
                            className="h-7 w-7 rounded-md text-ink-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeVariant(v.id)}
                            aria-label="Delete"
                            className="h-7 w-7 rounded-md text-ink-400 hover:text-pink-600 hover:bg-pink-50 flex items-center justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="border-t border-cream-200 px-4 py-2.5 bg-cream-50 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-ink-500">
              Showing{" "}
              <strong className="text-ink-800">
                {filteredVariants.length}
              </strong>{" "}
              of <strong className="text-ink-800">{variants.length}</strong>{" "}
              variants
            </span>
            <div className="flex items-center gap-4 text-ink-600">
              <span>
                Stock:{" "}
                <strong className="text-ink-900">{stats.totalStock}</strong>
              </span>
              <span>
                Value:{" "}
                <strong className="text-ink-900">
                  KSh {stats.totalValue.toLocaleString("en-KE")}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add manually ─── */}
      <button
        type="button"
        onClick={addBlankVariant}
        className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add a variant manually
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Stat card
// ═══════════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "blue" | "pink" | "sage" | "yellow";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600",
    pink: "bg-pink-50 text-pink-600",
    sage: "bg-sage-100 text-sage-700",
    yellow: "bg-yellow-100 text-yellow-700",
  }[tone];

  return (
    <div className="rounded-xl border border-cream-300 bg-white p-3">
      <div className="flex items-center gap-2 mb-1">
        <div
          className={cn(
            "h-7 w-7 rounded-lg flex items-center justify-center",
            toneClasses
          )}
        >
          {icon}
        </div>
      </div>
      <p className="text-[10px] text-ink-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-ink-900 mt-0.5">{value}</p>
    </div>
  );
}