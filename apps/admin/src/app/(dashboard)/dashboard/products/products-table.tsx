"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Star,
  Filter,
  X,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Copy,
  Boxes,
} from "lucide-react";

import { productsApi } from "@/lib/api/endpoints";
import { cn, formatKES } from "@/lib/utils";
import type { Product } from "@baby-shop/shared";

interface Category {
  _id: string;
  name: string;
}
interface Brand {
  _id: string;
  name: string;
}

interface Props {
  initialProducts: Product[];
  categories: Category[];
  brands: Brand[];
  canManage: boolean;
}

type StatusFilter = "all" | "published" | "draft" | "featured";
type SortKey = "newest" | "name-asc" | "price-asc" | "price-desc" | "stock-asc";

export function ProductsTable({
  initialProducts,
  categories,
  brands,
  canManage,
}: Props) {
  const router = useRouter();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<
    { ids: string[]; bulk: boolean } | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const removeMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete sequentially to avoid hammering the API
      for (const id of ids) {
        await productsApi.remove(id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setSelected(new Set());
      setConfirmDelete(null);
      router.refresh();
    },
    onError: (err: any) => setError(err?.message ?? "Could not delete"),
  });

  // ─── Filter + sort ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...initialProducts];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p as any).sku?.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }

    // Status
    if (statusFilter === "published") list = list.filter((p) => (p as any).isPublished);
    else if (statusFilter === "draft") list = list.filter((p) => !(p as any).isPublished);
    else if (statusFilter === "featured") list = list.filter((p) => (p as any).isFeatured);

    // Category
    if (categoryFilter) {
      list = list.filter((p) => {
        const cid = (p.categoryId as any)?.toString?.() ?? p.categoryId;
        return cid === categoryFilter;
      });
    }

    // Brand
    if (brandFilter) {
      list = list.filter((p) => {
        const bid = (p as any).brandId?.toString?.() ?? (p as any).brandId;
        return bid === brandFilter;
      });
    }

    // Sort
    switch (sort) {
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-asc":
        list.sort((a, b) => (a as any).basePrice - (b as any).basePrice);
        break;
      case "price-desc":
        list.sort((a, b) => (b as any).basePrice - (a as any).basePrice);
        break;
      case "stock-asc":
        list.sort((a, b) => {
          const sa = ((a as any).variants ?? []).reduce(
            (s: number, v: any) => s + (v.stock || 0),
            0
          );
          const sb = ((b as any).variants ?? []).reduce(
            (s: number, v: any) => s + (v.stock || 0),
            0
          );
          return sa - sb;
        });
        break;
      default:
        list.sort((a, b) => {
          const da = new Date((a as any).createdAt ?? 0).getTime();
          const db = new Date((b as any).createdAt ?? 0).getTime();
          return db - da;
        });
    }

    return list;
  }, [
    initialProducts,
    search,
    statusFilter,
    categoryFilter,
    brandFilter,
    sort,
  ]);

  const hasFilters =
    search || statusFilter !== "all" || categoryFilter || brandFilter;

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("");
    setBrandFilter("");
  }

  // ─── Selection helpers ─────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p._id)));
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <>
      {/* ─── Toolbar ─── */}
      <div className="mb-4 space-y-3">
        {/* Row 1: search + filters + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, slug…"
              className="w-full h-10 rounded-xl border-2 border-ink-200 bg-white pl-10 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* Status pills */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border-2 border-ink-200 bg-white">
            {(
              [
                { id: "all", label: "All" },
                { id: "published", label: "Published" },
                { id: "draft", label: "Drafts" },
                { id: "featured", label: "Featured" },
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

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-xl border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Brand */}
          {brands.length > 0 && (
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="h-10 rounded-xl border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-10 rounded-xl border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="name-asc">Name A → Z</option>
            <option value="price-asc">Price low → high</option>
            <option value="price-desc">Price high → low</option>
            <option value="stock-asc">Lowest stock</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm text-ink-500 hover:text-ink-800 hover:bg-cream-100 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Row 2: bulk actions (only if selection) */}
        {canManage && selected.size > 0 && (
          <div className="flex items-center justify-between rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2.5">
            <div className="text-sm text-blue-800">
              <strong>{selected.size}</strong> selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-blue-700 hover:text-blue-900"
              >
                Clear selection
              </button>
              <button
                onClick={() =>
                  setConfirmDelete({ ids: [...selected], bulk: true })
                }
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete selected
              </button>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="text-xs text-ink-500">
          Showing <strong>{filtered.length}</strong> of{" "}
          <strong>{initialProducts.length}</strong> products
        </div>
      </div>

      {/* ─── Error banner ─── */}
      {error && (
        <div className="mb-4 rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ─── Empty states ─── */}
      {initialProducts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cream-300 bg-white p-12 text-center">
          <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Package className="h-7 w-7 text-blue-500" />
          </div>
          <h3 className="font-semibold text-ink-900">No products yet</h3>
          <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">
            Your catalog is empty. Create your first product to start
            selling.
          </p>
          {canManage && <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create product
          </Link>}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cream-300 bg-white p-12 text-center">
          <div className="h-14 w-14 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
            <Filter className="h-7 w-7 text-ink-400" />
          </div>
          <h3 className="font-semibold text-ink-900">No matches</h3>
          <p className="text-sm text-ink-500 mt-1">
            No products match your current filters.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-blue-500 hover:text-blue-600"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* ─── Table ─── */
        <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr className="text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-3 w-10">
                    {canManage && <>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-ink-300 text-blue-500 focus:ring-blue-400"
                    />
                    </>}
                  </th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold w-24 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <ProductRow
                    key={p._id}
                    product={p}
                    canManage={canManage}
                    selected={selected.has(p._id)}
                    onToggle={() => toggleSelect(p._id)}
                    onDelete={() =>
                      setConfirmDelete({ ids: [p._id], bulk: false })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Delete confirmation modal ─── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="font-semibold text-ink-900">
                Delete{" "}
                {confirmDelete.bulk
                  ? `${confirmDelete.ids.length} products`
                  : "product"}
                ?
              </h3>
            </div>
            <p className="text-sm text-ink-600 mb-5">
              This will permanently remove the{" "}
              {confirmDelete.bulk ? "selected products" : "product"} from your
              catalog. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="h-10 px-4 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:bg-cream-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => removeMutation.mutate(confirmDelete.ids)}
                disabled={removeMutation.isPending}
                className="h-10 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {removeMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Row
// ═══════════════════════════════════════════════════════════

function ProductRow({
  product,
  canManage,
  selected,
  onToggle,
  onDelete,
}: {
  product: Product;
  canManage: boolean;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const variants = (product as any).variants ?? [];
  const totalStock = variants.reduce(
    (s: number, v: any) => s + (v.stock || 0),
    0
  );
  const hasVariants = variants.length > 0;
  const image = (product as any).images?.[0]?.url;
  const isPublished = (product as any).isPublished;
  const isFeatured = (product as any).isFeatured;
  const salePrice = (product as any).salePrice;
  const hasSale = salePrice != null && salePrice < product.basePrice;

  // Stock status
  const lowStock = totalStock > 0 && totalStock <= 5;
  const outOfStock = totalStock === 0;

  return (
    <tr
      className={cn(
        "border-b border-cream-200 last:border-0 hover:bg-cream-50/50 transition-colors",
        selected && "bg-blue-50/40"
      )}
    >
      <td className="px-4 py-3">
        {canManage && <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-ink-300 text-blue-500 focus:ring-blue-400"
        />}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-cream-100 border border-cream-200 overflow-hidden shrink-0 relative">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cream-400">
                <Package className="h-5 w-5" />
              </div>
            )}
          </div>
<div className="min-w-0">
  <div className="flex items-center gap-2">
    <Link
      href={`/dashboard/products/${product._id}`}
      className="font-medium text-ink-900 truncate max-w-[220px] hover:text-blue-600 transition-colors"
    >
      {product.name}
    </Link>
    {isFeatured && (
      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
    )}
  </div>
            <p className="text-xs text-ink-500 font-mono truncate max-w-[220px]">
              {product.slug}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="text-xs font-mono text-ink-600">
          {(product as any).sku ?? "—"}
        </span>
      </td>

      <td className="px-4 py-3">
        {hasSale ? (
          <div>
            <div className="font-semibold text-ink-900">
              {formatKES(salePrice)}
            </div>
            <div className="text-xs text-ink-400 line-through">
              {formatKES(product.basePrice)}
            </div>
          </div>
        ) : (
          <div className="font-semibold text-ink-900">
            {formatKES(product.basePrice)}
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Boxes
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              outOfStock
                ? "text-pink-500"
                : lowStock
                ? "text-yellow-500"
                : "text-sage-500"
            )}
          />
          <span
            className={cn(
              "text-sm font-medium",
              outOfStock
                ? "text-pink-600"
                : lowStock
                ? "text-yellow-700"
                : "text-ink-700"
            )}
          >
            {totalStock}
          </span>
          {hasVariants && (
            <span className="text-[10px] text-ink-400">
              ({variants.length} var)
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        {isPublished ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-700 text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cream-200 text-ink-600 text-[11px] font-semibold">
            <Circle className="h-3 w-3" />
            Draft
          </span>
        )}
      </td>

      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          {canManage && <Link
            href={`/dashboard/products/${product._id}/edit`}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-ink-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            aria-label="Edit"
          >
            <Edit className="h-4 w-4" />
          </Link>}
          {canManage && <button
            onClick={onDelete}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-ink-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>}
        </div>
      </td>
    </tr>
  );
}
