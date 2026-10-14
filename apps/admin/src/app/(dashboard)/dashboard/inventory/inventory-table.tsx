"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Boxes,
  AlertTriangle,
  Package,
  DollarSign,
  Layers,
  Edit,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  Download,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  EyeOff,
  Minus,
  Plus,
  Save,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { productsApi } from "@/lib/api/endpoints";
import { cn, formatKES } from "@/lib/utils";
import type { Product } from "@baby-shop/shared";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

interface Props {
  initialProducts: Product[];
  canManageStock: boolean;
  canManageProducts: boolean;
}

interface FlatVariant {
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  productPublished: boolean;
  categoryId?: string;
  brandId?: string;
  variantId: string;
  sku: string;
  size?: string;
  color?: string;
  price: number;
  stock: number;
  lowStockAt: number;
  variantIndex: number;
}

type StatusFilter = "all" | "in" | "low" | "out";
type SortKey = "stock-asc" | "stock-desc" | "value-desc" | "name-asc";

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function InventoryTable({ initialProducts, canManageStock, canManageProducts }: Props) {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("stock-asc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkOp, setBulkOp] = useState<"set" | "add" | "subtract">("set");
  const [bulkValue, setBulkValue] = useState("");
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // ─── Flatten variants ──────────────────────────────────
  const allVariants: FlatVariant[] = useMemo(() => {
    const out: FlatVariant[] = [];
    for (const p of initialProducts) {
      const variants = (p as any).variants ?? [];
      const images = (p as any).images ?? [];
      variants.forEach((v: any, idx: number) => {
        out.push({
          productId: p._id,
          productName: p.name,
          productSlug: p.slug,
          productImage: images[0]?.url,
          productPublished: (p as any).isPublished,
          categoryId: (p as any).categoryId?.toString?.(),
          brandId: (p as any).brandId?.toString?.(),
          variantId: v._id ?? `${p._id}-${idx}`,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          stock: v.stock,
          lowStockAt: v.lowStockAt ?? 5,
          variantIndex: idx,
        });
      });
    }
    return out;
  }, [initialProducts]);

  // ─── Filter + sort ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allVariants];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.sku.toLowerCase().includes(q) ||
          v.productName.toLowerCase().includes(q) ||
          (v.color ?? "").toLowerCase().includes(q) ||
          (v.size ?? "").toLowerCase().includes(q)
      );
    }

    if (statusFilter === "in") list = list.filter((v) => v.stock > v.lowStockAt);
    else if (statusFilter === "low")
      list = list.filter((v) => v.stock > 0 && v.stock <= v.lowStockAt);
    else if (statusFilter === "out") list = list.filter((v) => v.stock === 0);

    if (categoryFilter) list = list.filter((v) => v.categoryId === categoryFilter);

    switch (sort) {
      case "stock-asc":
        list.sort((a, b) => a.stock - b.stock);
        break;
      case "stock-desc":
        list.sort((a, b) => b.stock - a.stock);
        break;
      case "value-desc":
        list.sort((a, b) => b.stock * b.price - a.stock * a.price);
        break;
      case "name-asc":
        list.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
    }

    return list;
  }, [allVariants, search, statusFilter, categoryFilter, sort]);

  // ─── Stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalSkus = allVariants.length;
    const totalUnits = allVariants.reduce((s, v) => s + v.stock, 0);
    const totalValue = allVariants.reduce((s, v) => s + v.stock * v.price, 0);
    const lowStock = allVariants.filter(
      (v) => v.stock > 0 && v.stock <= v.lowStockAt
    ).length;
    const outOfStock = allVariants.filter((v) => v.stock === 0).length;
    return { totalSkus, totalUnits, totalValue, lowStock, outOfStock };
  }, [allVariants]);

  // ─── Categories for filter ─────────────────────────────
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of initialProducts) {
      const c = (p as any).categoryId;
      if (c?._id && c?.name) map.set(c._id.toString(), c.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [initialProducts]);

  // ─── Save stock edits ──────────────────────────────────
  const saveStockMutation = useMutation({
    mutationFn: async ({
      productId,
      variantId,
      stock,
    }: {
      productId: string;
      variantId: string;
      stock: number;
    }) => {
      return productsApi.updateInventory(productId, [{ variantId, stock }]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setEdits({});
    },
    onError: (err: any) => {
      setError(err?.message ?? "Could not save stock");
    },
  });

  // ─── Bulk apply ────────────────────────────────────────
  function applyBulk() {
    const num = Number(bulkValue);
    if (!Number.isFinite(num) || num < 0) return;

    // Group changes by product for efficient updates
    const byProduct = new Map<string, Map<string, number>>();
    for (const v of allVariants) {
      if (!selected.has(v.variantId)) continue;
      const current = edits[v.variantId] ?? v.stock;
      let next = current;
      if (bulkOp === "set") next = num;
      if (bulkOp === "add") next = current + num;
      if (bulkOp === "subtract") next = Math.max(0, current - num);
      const m = byProduct.get(v.productId) ?? new Map();
      m.set(v.variantId, next);
      byProduct.set(v.productId, m);
    }

    // Sequentially apply
    (async () => {
      for (const [productId, changes] of byProduct) {
        try {
          await productsApi.updateInventory(productId, Array.from(changes, ([variantId, stock]) => ({ variantId, stock })));
        } catch (err) {
          console.error("Bulk update failed for product", productId, err);
        }
      }
      qc.invalidateQueries({ queryKey: ["products"] });
      setSelected(new Set());
      setBulkOpen(false);
      setBulkValue("");
    })();
  }

  // ─── Export CSV ────────────────────────────────────────
  function exportCsv() {
    const rows = filtered.map((v) => ({
      Product: v.productName,
      SKU: v.sku,
      Size: v.size ?? "",
      Color: v.color ?? "",
      Stock: v.stock,
      "Low Stock At": v.lowStockAt,
      "Price (KSh)": v.price,
      "Value (KSh)": v.stock * v.price,
      Status: v.stock === 0 ? "Out" : v.stock <= v.lowStockAt ? "Low" : "In",
    }));

    const headers = Object.keys(rows[0] ?? {});
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const val = (r as any)[h] ?? "";
            const s = String(val);
            return s.includes(",") || s.includes('"')
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Group by product for the table ────────────────────
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        product: Product;
        variants: FlatVariant[];
        totalStock: number;
        totalValue: number;
      }
    >();
    for (const v of filtered) {
      const p = initialProducts.find((x) => x._id === v.productId)!;
      const entry = map.get(v.productId) ?? {
        product: p,
        variants: [],
        totalStock: 0,
        totalValue: 0,
      };
      entry.variants.push(v);
      entry.totalStock += v.stock;
      entry.totalValue += v.stock * v.price;
      map.set(v.productId, entry);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.product.name.localeCompare(b.product.name)
    );
  }, [filtered, initialProducts]);

  // ─── Selection helpers ─────────────────────────────────
  function toggleVariant(variantId: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(variantId)) n.delete(variantId);
      else n.add(variantId);
      return n;
    });
  }

  function toggleGroup(variantIds: string[]) {
    setSelected((s) => {
      const allSelected = variantIds.every((id) => s.has(id));
      const n = new Set(s);
      if (allSelected) variantIds.forEach((id) => n.delete(id));
      else variantIds.forEach((id) => n.add(id));
      return n;
    });
  }

  function toggleExpand(productId: string) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(productId)) n.delete(productId);
      else n.add(productId);
      return n;
    });
  }

  const hasFilters = search || statusFilter !== "all" || categoryFilter;

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("");
  }

  return (
    <>
      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="Total SKUs"
          value={String(stats.totalSkus)}
          tone="blue"
        />
        <StatCard
          icon={<Boxes className="h-4 w-4" />}
          label="Total units"
          value={stats.totalUnits.toLocaleString("en-KE")}
          tone="sage"
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Inventory value"
          value={formatKES(stats.totalValue)}
          tone="pink"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Low stock"
          value={String(stats.lowStock)}
          tone={stats.lowStock > 0 ? "yellow" : "sage"}
        />
        <StatCard
          icon={<EyeOff className="h-4 w-4" />}
          label="Out of stock"
          value={String(stats.outOfStock)}
          tone={stats.outOfStock > 0 ? "pink" : "sage"}
        />
      </div>

      {/* ═══ Toolbar ═══ */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, product, size, color…"
              className="w-full h-10 rounded-xl border-2 border-ink-200 bg-white pl-10 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl border-2 border-ink-200 bg-white">
            {(
              [
                { id: "all", label: "All" },
                { id: "in", label: "In stock" },
                { id: "low", label: "Low" },
                { id: "out", label: "Out" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                  statusFilter === s.id
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-cream-100"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-xl border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-10 rounded-xl border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="stock-asc">Lowest stock</option>
            <option value="stock-desc">Highest stock</option>
            <option value="value-desc">Highest value</option>
            <option value="name-asc">Product A → Z</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm text-ink-500 hover:text-ink-800 hover:bg-cream-100"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}

          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border-2 border-ink-200 bg-white text-sm font-medium text-ink-700 hover:bg-cream-100 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Bulk bar */}
        {canManageStock && selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2.5">
            <span className="text-sm text-blue-800">
              <strong>{selected.size}</strong> variant
              {selected.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setBulkOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600"
              >
                <Save className="h-3.5 w-3.5" />
                Bulk adjust
              </button>
              <button
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
            <span className="text-xs font-medium text-ink-700">Action</span>
            <select
              value={bulkOp}
              onChange={(e) => setBulkOp(e.target.value as any)}
              className="h-9 rounded-lg border-2 border-ink-200 bg-white px-2 text-xs"
            >
              <option value="set">Set to</option>
              <option value="add">Add</option>
              <option value="subtract">Subtract</option>
            </select>
            <input
              type="number"
              min={0}
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder="Qty"
              className="h-9 w-24 rounded-lg border-2 border-ink-200 bg-white px-2.5 text-xs"
            />
            <button
              onClick={applyBulk}
              disabled={!bulkValue}
              className="h-9 px-3 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              Apply
            </button>
            <button
              onClick={() => setBulkOpen(false)}
              className="h-9 px-3 rounded-lg text-xs text-ink-500 hover:text-ink-800"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="text-xs text-ink-500">
          Showing <strong>{filtered.length}</strong> of{" "}
          <strong>{allVariants.length}</strong> variants
        </div>
      </div>

      {/* ═══ Error ═══ */}
      {error && (
        <div className="mb-4 rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ═══ Empty states ═══ */}
      {allVariants.length === 0 ? (
        <EmptyState
          icon={<Package className="h-7 w-7 text-blue-500" />}
          title="No products yet"
          body="Create a product to start tracking inventory."
          cta={{ href: "/dashboard/products/new", label: "Create product" }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-7 w-7 text-ink-400" />}
          title="No matches"
          body="No variants match your filters."
          onClear={clearFilters}
        />
      ) : (
        /* ═══ Table ═══ */
        <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr className="text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-3 py-3 w-10"></th>
                  <th className="px-3 py-3 w-10"></th>
                  <th className="px-3 py-3 font-semibold">Product / Variant</th>
                  <th className="px-3 py-3 font-semibold">SKU</th>
                  <th className="px-3 py-3 font-semibold">Size · Color</th>
                  <th className="px-3 py-3 font-semibold text-right">Price</th>
                  <th className="px-3 py-3 font-semibold text-right w-32">
                    Stock
                  </th>
                  <th className="px-3 py-3 font-semibold text-right">Value</th>
                  <th className="px-3 py-3 font-semibold w-12"></th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((group) => {
                  const isExpanded = expanded.has(group.product._id);
                  const variantIds = group.variants.map((v) => v.variantId);
                  const allSelected = variantIds.every((id) =>
                    selected.has(id)
                  );
                  const someSelected = variantIds.some((id) =>
                    selected.has(id)
                  );

                  return (
                    <ProductGroup
                      key={group.product._id}
                      group={group}
                      isExpanded={isExpanded}
                      allSelected={allSelected}
                      someSelected={someSelected}
                      selectedIds={selected}
                      edits={edits}
                      onToggleExpand={() => toggleExpand(group.product._id)}
                      onToggleGroup={() => toggleGroup(variantIds)}
                      onToggleVariant={toggleVariant}
                      onEditStock={(variantId, value) =>
                        setEdits((e) => ({ ...e, [variantId]: value }))
                      }
                      onSaveStock={(variantId, stock) =>
                        saveStockMutation.mutate({
                          productId: group.product._id,
                          variantId,
                          stock,
                        })
                      }
                      isSaving={saveStockMutation.isPending}
                      canManageStock={canManageStock}
                      canManageProducts={canManageProducts}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Product group + variant row
// ═══════════════════════════════════════════════════════════

function ProductGroup({
  group,
  isExpanded,
  allSelected,
  someSelected,
  selectedIds,
  edits,
  onToggleExpand,
  onToggleGroup,
  onToggleVariant,
  onEditStock,
  onSaveStock,
  isSaving,
  canManageStock,
  canManageProducts,
}: {
  group: {
    product: Product;
    variants: FlatVariant[];
    totalStock: number;
    totalValue: number;
  };
  isExpanded: boolean;
  allSelected: boolean;
  someSelected: boolean;
  selectedIds: Set<string>;
  edits: Record<string, number>;
  onToggleExpand: () => void;
  onToggleGroup: () => void;
  onToggleVariant: (id: string) => void;
  onEditStock: (id: string, v: number) => void;
  onSaveStock: (id: string, stock: number) => void;
  isSaving: boolean;
  canManageStock: boolean;
  canManageProducts: boolean;
}) {
  const p = group.product;
  const image = (p as any).images?.[0]?.url;
  const lowCount = group.variants.filter(
    (v) => v.stock > 0 && v.stock <= v.lowStockAt
  ).length;
  const outCount = group.variants.filter((v) => v.stock === 0).length;

  return (
    <>
      {/* ── Product header row ── */}
      <tr
        className={cn(
          "border-b border-cream-200 cursor-pointer hover:bg-cream-50/60",
          allSelected && "bg-blue-50/40"
        )}
        onClick={onToggleExpand}
      >
        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = !allSelected && someSelected;
            }}
            onChange={onToggleGroup}
            disabled={!canManageStock}
            className="h-4 w-4 rounded border-ink-300 text-blue-500"
          />
        </td>
        <td className="px-3 py-3">
          <div className="text-ink-500">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cream-100 border border-cream-200 overflow-hidden relative shrink-0">
              {image ? (
                <Image
                  src={image}
                  alt={p.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cream-400">
                  <Package className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-ink-900 truncate max-w-[280px]">
                {p.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-ink-500">
                <span>
                  {group.variants.length} variant
                  {group.variants.length !== 1 ? "s" : ""}
                </span>
                {lowCount > 0 && (
                  <span className="text-yellow-700 font-medium">
                    · {lowCount} low
                  </span>
                )}
                {outCount > 0 && (
                  <span className="text-pink-700 font-medium">
                    · {outCount} out
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-ink-400">—</td>
        <td className="px-3 py-3 text-ink-400">—</td>
        <td className="px-3 py-3 text-ink-400 text-right">—</td>
        <td className="px-3 py-3 text-right font-semibold text-ink-900">
          {group.totalStock}
        </td>
        <td className="px-3 py-3 text-right text-ink-700 font-medium">
          {formatKES(group.totalValue)}
        </td>
        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
          {canManageProducts && <Link
            href={`/dashboard/products/${p._id}/edit`}
            className="h-8 w-8 rounded-lg text-ink-500 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center"
            title="Edit product"
          >
            <Edit className="h-3.5 w-3.5" />
          </Link>}
        </td>
      </tr>

      {/* ── Variant rows ── */}
      {isExpanded &&
        group.variants.map((v) => (
          <VariantRow
            key={v.variantId}
            variant={v}
            selected={selectedIds.has(v.variantId)}
            editedStock={edits[v.variantId]}
            onToggle={() => onToggleVariant(v.variantId)}
            onEditStock={(value) => onEditStock(v.variantId, value)}
            onSaveStock={(stock) => onSaveStock(v.variantId, stock)}
            isSaving={isSaving}
            canManageStock={canManageStock}
          />
        ))}
    </>
  );
}

function VariantRow({
  variant,
  selected,
  editedStock,
  onToggle,
  onEditStock,
  onSaveStock,
  isSaving,
  canManageStock,
}: {
  variant: FlatVariant;
  selected: boolean;
  editedStock?: number;
  onToggle: () => void;
  onEditStock: (v: number) => void;
  onSaveStock: (v: number) => void;
  isSaving: boolean;
  canManageStock: boolean;
}) {
  const currentStock = editedStock ?? variant.stock;
  const isDirty = editedStock !== undefined && editedStock !== variant.stock;

  const stockTone =
    currentStock === 0
      ? "pink"
      : currentStock <= variant.lowStockAt
      ? "yellow"
      : "sage";

  return (
    <tr
      className={cn(
        "border-b border-cream-100 last:border-0 hover:bg-cream-50/30",
        selected && "bg-blue-50/30"
      )}
    >
      <td className="px-3 py-2.5" />

      {/* indent */}
      <td className="px-3 py-2.5">
        <div className="w-4 h-px bg-cream-300 ml-2" />
      </td>

      <td className="px-3 py-2.5">
        <div className="pl-12">
          <p className="text-sm text-ink-700">
            {variant.size && variant.color
              ? `${variant.size} · ${variant.color}`
              : variant.size || variant.color || "Default variant"}
          </p>
        </div>
      </td>

      <td className="px-3 py-2.5">
        <span className="font-mono text-[11px] text-ink-600">
          {variant.sku}
        </span>
      </td>

      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          {variant.size && <span>{variant.size}</span>}
          {variant.size && variant.color && <span>·</span>}
          {variant.color && <span>{variant.color}</span>}
          {!variant.size && !variant.color && <span>—</span>}
        </div>
      </td>

      <td className="px-3 py-2.5 text-right font-medium text-ink-900">
        {formatKES(variant.price)}
      </td>

      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1.5">
          <input
            type="number"
            min={0}
            value={currentStock}
            disabled={!canManageStock}
            onChange={(e) => onEditStock(Number(e.target.value) || 0)}
            className={cn(
              "w-20 h-8 rounded-lg border-2 bg-white px-2 text-sm text-right focus:outline-none",
              stockTone === "pink" &&
                "border-pink-300 text-pink-700 focus:border-pink-500",
              stockTone === "yellow" &&
                "border-yellow-300 text-yellow-800 focus:border-yellow-500",
              stockTone === "sage" &&
                "border-cream-300 text-ink-900 focus:border-blue-400"
            )}
          />
          {canManageStock && isDirty && (
            <button
              onClick={() => onSaveStock(currentStock)}
              disabled={isSaving}
              className="h-8 w-8 rounded-lg bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-50"
              title="Save"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </td>

      <td className="px-3 py-2.5 text-right text-ink-600">
        {formatKES(currentStock * variant.price)}
      </td>

      <td className="px-3 py-2.5" />
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════
// Helpers
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
  tone: "blue" | "sage" | "pink" | "yellow" | "default";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600",
    sage: "bg-sage-100 text-sage-700",
    pink: "bg-pink-50 text-pink-600",
    yellow: "bg-yellow-100 text-yellow-700",
    default: "bg-cream-100 text-ink-600",
  }[tone];

  return (
    <div className="rounded-xl border-2 border-cream-300 bg-white p-3">
      <div
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center mb-2",
          toneClasses
        )}
      >
        {icon}
      </div>
      <p className="text-[10px] text-ink-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-ink-900 mt-0.5">{value}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  cta,
  onClear,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta?: { href: string; label: string };
  onClear?: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-cream-300 bg-white p-12 text-center">
      <div className="h-14 w-14 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold"
        >
          {cta.label}
        </Link>
      )}
      {onClear && (
        <button
          onClick={onClear}
          className="mt-4 text-sm text-blue-500 hover:text-blue-600"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
