"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Edit,
  Trash2,
  Award,
  AlertTriangle,
  Search,
  Eye,
  EyeOff,
  X,
  Filter,
  ExternalLink,
  Package,
} from "lucide-react";
import { brandsApi } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import type { Brand } from "@baby-shop/shared";

interface Props {
  initialBrands: Brand[];
  canManage?: boolean;
}

type StatusFilter = "all" | "active" | "hidden";
type SortKey = "name-asc" | "newest";

export function BrandsTable({ initialBrands, canManage = true }: Props) {
  const qc = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [confirmDelete, setConfirmDelete] = useState<Brand | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandsApi.list(),
    initialData: {
      items: initialBrands,
      total: initialBrands.length,
      page: 1,
      pageSize: initialBrands.length,
      totalPages: 1,
    },
  });

  const brands = data?.items ?? [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => brandsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      setConfirmDelete(null);
      router.refresh();
    },
    onError: (err: any) => {
      setError(err?.message ?? "Could not delete brand");
      setConfirmDelete(null);
    },
  });

  const filtered = useMemo(() => {
    let list = [...brands];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q) ||
          ((b as any).description ?? "").toLowerCase().includes(q)
      );
    }

    if (statusFilter === "active")
      list = list.filter((b) => (b as any).isActive !== false);
    else if (statusFilter === "hidden")
      list = list.filter((b) => (b as any).isActive === false);

    switch (sort) {
      case "newest":
        list.sort((a, b) => {
          const da = new Date((a as any).createdAt ?? 0).getTime();
          const db = new Date((b as any).createdAt ?? 0).getTime();
          return db - da;
        });
        break;
      default:
        list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [brands, search, statusFilter, sort]);

  const hasFilters = search || statusFilter !== "all" || sort !== "name-asc";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setSort("name-asc");
  }

  if (!canManage) return <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white"><div className="divide-y divide-cream-100">{filtered.map((brand) => <div key={brand._id} className="flex items-center justify-between px-5 py-4"><span className="text-sm font-semibold text-ink-800">{brand.name}</span><span className="text-xs text-ink-500">Brand</span></div>)}</div></div>;

  // ─── Empty states ───
  if (brands.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-cream-300 bg-white p-12 text-center">
        <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Award className="h-7 w-7 text-blue-500" />
        </div>
        <h3 className="font-semibold text-ink-900">No brands yet</h3>
        <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">
          Brands help customers identify products from manufacturers they
          trust. Add your first one.
        </p>
        <Link
          href="/dashboard/brands/new"
          className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
        >
          Create brand
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands…"
              className="w-full h-10 rounded-xl border-2 border-ink-200 bg-white pl-10 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl border-2 border-ink-200 bg-white">
            {(
              [
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "hidden", label: "Hidden" },
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

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-10 rounded-xl border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="name-asc">Name A → Z</option>
            <option value="newest">Newest first</option>
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
        </div>

        <div className="text-xs text-ink-500">
          Showing <strong>{filtered.length}</strong> of{" "}
          <strong>{brands.length}</strong> brands
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* No matches */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cream-300 bg-white p-12 text-center">
          <div className="h-14 w-14 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
            <Filter className="h-7 w-7 text-ink-400" />
          </div>
          <h3 className="font-semibold text-ink-900">No matches</h3>
          <p className="text-sm text-ink-500 mt-1">
            No brands match your filters.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-blue-500 hover:text-blue-600"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* Table */
        <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr className="text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-3 font-semibold">Brand</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Website</th>
                  <th className="px-4 py-3 font-semibold w-24">Status</th>
                  <th className="px-4 py-3 font-semibold w-24 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((brand) => {
                  const isActive = (brand as any).isActive !== false;
                  const logo = (brand as any).logoUrl;
                  const website = (brand as any).website;

                  return (
                    <tr
                      key={brand._id}
                      className="border-b border-cream-200 last:border-0 hover:bg-cream-50/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-xl bg-cream-100 border border-cream-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                            {logo ? (
                              <Image
                                src={logo}
                                alt={brand.name}
                                fill
                                sizes="44px"
                                className="object-contain p-1"
                              />
                            ) : (
                              <Award className="h-5 w-5 text-cream-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/brands/${brand._id}`}
                              className="font-medium text-ink-900 truncate max-w-[220px] hover:text-blue-600 transition-colors block"
                            >
                              {brand.name}
                            </Link>
                            {(brand as any).description && (
                              <p className="text-xs text-ink-500 truncate max-w-[260px] mt-0.5">
                                {(brand as any).description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-ink-600 bg-cream-50 px-2 py-0.5 rounded">
                          {brand.slug}
                        </code>
                      </td>

                      <td className="px-4 py-3">
                        {website ? (
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 truncate max-w-[200px]"
                          >
                            {new URL(website).hostname}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-ink-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-700 text-[11px] font-semibold">
                            <Eye className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cream-200 text-ink-600 text-[11px] font-semibold">
                            <EyeOff className="h-3 w-3" />
                            Hidden
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/dashboard/brands/${brand._id}`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-ink-500 hover:text-sage-600 hover:bg-sage-50 transition-colors"
                            aria-label="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/dashboard/brands/${brand._id}/edit`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-ink-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            aria-label="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setConfirmDelete(brand)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-ink-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="font-semibold text-ink-900">Delete brand?</h3>
            </div>
            <p className="text-sm text-ink-600 mb-5">
              Delete <strong>&ldquo;{confirmDelete.name}&rdquo;</strong>? This
              cannot be undone. Brands with products cannot be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="h-10 px-4 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                onClick={() => removeMutation.mutate(confirmDelete._id)}
                disabled={removeMutation.isPending}
                className="h-10 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold"
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
