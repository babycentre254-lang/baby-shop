"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Tags, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { categoriesApi } from "@/lib/api/endpoints";
import type { Category } from "@baby-shop/shared";

interface Props {
  initialCategories: Category[];
}

export function CategoriesTable({ initialCategories }: Props) {
  const qc = useQueryClient();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    initialData: {
      items: initialCategories,
      total: initialCategories.length,
      page: 1,
      pageSize: initialCategories.length,
      totalPages: 1,
    },
  });

  const categories = data?.items ?? [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setConfirmDelete(null);
      router.refresh();
    },
    onError: (err: any) => {
      setError(err?.message ?? "Could not delete category");
    },
  });

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-cream-300 bg-white p-12 text-center">
        <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Tags className="h-7 w-7 text-blue-500" />
        </div>
        <h3 className="font-semibold text-ink-900">No categories yet</h3>
        <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">
          Categories help customers browse your store. Create your first one
          to get started.
        </p>
        <Link
          href="/dashboard/categories/new"
          className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
        >
          Create category
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-cream-200">
              <tr className="text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Parent</th>
                <th className="px-4 py-3 font-semibold w-32">Sort</th>
                <th className="px-4 py-3 font-semibold w-32 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat._id}
                  className="border-b border-cream-200 last:border-0 hover:bg-cream-50/50"
                >
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-ink-500 font-mono text-xs">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {cat.parentId ? "—" : "Root"}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{cat.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/dashboard/categories/${cat._id}/edit`}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-ink-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(cat)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-ink-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="font-semibold text-ink-900">Delete category?</h3>
            </div>
            <p className="text-sm text-ink-600 mb-5">
              Delete <strong>&ldquo;{confirmDelete.name}&rdquo;</strong>? This
              cannot be undone. Categories with subcategories or products
              cannot be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="h-10 px-4 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:bg-cream-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => removeMutation.mutate(confirmDelete._id)}
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