"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Award,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Calendar,
  Clock,
  AlertTriangle,
  X,
  Package,
  Search,
  Share2,
  Star,
  DollarSign,
  Boxes,
  TrendingUp,
} from "lucide-react";

import { brandsApi } from "@/lib/api/endpoints";
import { cn, formatKES, formatDate } from "@/lib/utils";
import type { Brand, Product } from "@baby-shop/shared";

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function BrandDetail({
  brand,
  products,
}: {
  brand: Brand;
  products: Product[];
}) {
  const router = useRouter();
  const qc = useQueryClient();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = (brand as any).isActive !== false;
  const logo = (brand as any).logoUrl;
  const website = (brand as any).website;

  // ─── Aggregate stats across all products in this brand ───
  const stats = products.reduce(
    (acc, p) => {
      const variants = (p as any).variants ?? [];
      const published = (p as any).isPublished;
      acc.totalProducts += 1;
      if (published) acc.publishedProducts += 1;
      acc.totalVariants += variants.length;
      for (const v of variants) {
        acc.totalStock += v.stock || 0;
        acc.totalValue += (v.stock || 0) * (v.price || 0);
      }
      return acc;
    },
    {
      totalProducts: 0,
      publishedProducts: 0,
      totalVariants: 0,
      totalStock: 0,
      totalValue: 0,
    }
  );

  // ─── Delete ───
  const deleteMutation = useMutation({
    mutationFn: () => brandsApi.remove(brand._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      router.push("/dashboard/brands");
      router.refresh();
    },
    onError: (err: any) => {
      setError(err?.message ?? "Could not delete brand");
      setConfirmDelete(false);
    },
  });

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  const canDelete = products.length === 0;

  return (
    <div className="pb-24 lg:pb-0">
      {/* ═══ Header ═══ */}
      <div className="mb-6">
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to brands
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-ink-900">
                {brand.name}
              </h1>
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sage-100 text-sage-700 text-xs font-semibold">
                  <Eye className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream-200 text-ink-600 text-xs font-semibold">
                  <EyeOff className="h-3 w-3" />
                  Hidden
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3 flex-wrap text-xs">
              <button
                onClick={() => copy(brand.slug, "slug")}
                className="inline-flex items-center gap-1 text-ink-500 hover:text-blue-600 font-mono bg-cream-50 border border-cream-200 px-2 py-0.5 rounded transition-colors"
              >
                /{brand.slug}
                {copiedId === "slug" ? (
                  <Check className="h-3 w-3 text-sage-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>

              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600"
                >
                  <Globe className="h-3 w-3" />
                  {new URL(website).hostname}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={!canDelete}
              className={cn(
                "h-10 w-10 rounded-xl border-2 flex items-center justify-center transition-colors",
                canDelete
                  ? "border-cream-300 text-pink-600 hover:bg-pink-50 hover:border-pink-300"
                  : "border-cream-200 text-ink-300 cursor-not-allowed"
              )}
              title={
                canDelete
                  ? "Delete brand"
                  : `${products.length} product(s) still reference this brand`
              }
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <Link
              href={`/dashboard/brands/${brand._id}/edit`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit brand
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ═══ Main grid ═══ */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* ─── Left column ─── */}
        <div className="space-y-5 min-w-0">
          {/* Logo */}
          <Section title="Brand logo" icon={<Award className="h-4 w-4" />}>
            <div className="aspect-[3/2] rounded-2xl bg-cream-100 border-2 border-cream-200 flex items-center justify-center overflow-hidden p-8">
              {logo ? (
                <Image
                  src={logo}
                  alt={brand.name}
                  width={400}
                  height={240}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <Award className="h-12 w-12 text-cream-400 mx-auto mb-2" />
                  <p className="text-xs text-ink-400">No logo uploaded</p>
                </div>
              )}
            </div>
          </Section>

          {/* Description */}
          {brand.description ? (
            <Section
              title="Description"
              icon={<Award className="h-4 w-4" />}
            >
              <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">
                {brand.description}
              </p>
            </Section>
          ) : (
            <Section title="Description" icon={<Award className="h-4 w-4" />}>
              <div className="rounded-xl border-2 border-dashed border-cream-300 bg-cream-50 p-6 text-center">
                <p className="text-sm text-ink-500">
                  No description yet. Add one in the{" "}
                  <Link
                    href={`/dashboard/brands/${brand._id}/edit`}
                    className="text-blue-500 hover:underline"
                  >
                    edit form
                  </Link>
                  .
                </p>
              </div>
            </Section>
          )}

          {/* Products */}
          <Section
            title={`Products (${products.length})`}
            icon={<Package className="h-4 w-4" />}
          >
            {products.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-cream-300 bg-cream-50 p-8 text-center">
                <Package className="h-10 w-10 text-cream-400 mx-auto mb-2" />
                <p className="text-sm text-ink-500">
                  No products in this brand yet.
                </p>
                <Link
                  href="/dashboard/products/new"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-blue-500 hover:text-blue-600"
                >
                  Create a product
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((p) => {
                  const image = (p as any).images?.[0]?.url;
                  const published = (p as any).isPublished;
                  const stock = ((p as any).variants ?? []).reduce(
                    (s: number, v: any) => s + (v.stock || 0),
                    0
                  );
                  return (
                    <Link
                      key={p._id}
                      href={`/dashboard/products/${p._id}`}
                      className="group rounded-xl border-2 border-cream-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="aspect-square bg-cream-100 relative overflow-hidden">
                        {image ? (
                          <Image
                            src={image}
                            alt={p.name}
                            fill
                            sizes="200px"
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-cream-400">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                        {!published && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-ink-800/80 text-white text-[10px] font-bold">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-ink-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {p.name}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-ink-500">
                            {formatKES((p as any).basePrice)}
                          </span>
                          <span
                            className={cn(
                              "font-medium",
                              stock === 0
                                ? "text-pink-600"
                                : stock <= 5
                                ? "text-yellow-700"
                                : "text-sage-600"
                            )}
                          >
                            {stock} in stock
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>

          {/* SEO preview */}
          <Section title="SEO Preview" icon={<Search className="h-4 w-4" />}>
            <div className="rounded-xl border border-cream-200 bg-white p-4">
              <p className="text-[11px] text-ink-800 leading-tight">
                BabyCentre
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                babycentre.co.ke › brands › {brand.slug}
              </p>
              <p className="text-base text-blue-700 mt-1.5 hover:underline cursor-pointer line-clamp-1">
                {(brand as any).metaTitle || `${brand.name} | BabyCentre`}
              </p>
              <p className="text-xs text-ink-600 line-clamp-2 mt-0.5">
                {(brand as any).metaDescription ||
                  brand.description ||
                  `Shop ${brand.name} products at BabyCentre.`}
              </p>
            </div>
          </Section>
        </div>

        {/* ─── Right column ─── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Stats */}
          <Card title="Brand overview">
            <StatRow
              icon={<Package className="h-3.5 w-3.5" />}
              label="Products"
              value={String(stats.totalProducts)}
              tone="blue"
            />
            {stats.publishedProducts !== stats.totalProducts && (
              <StatRow
                icon={<Eye className="h-3.5 w-3.5" />}
                label="Published"
                value={String(stats.publishedProducts)}
              />
            )}
            <StatRow
              icon={<Boxes className="h-3.5 w-3.5" />}
              label="Variants"
              value={String(stats.totalVariants)}
            />
            <StatRow
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Total stock"
              value={`${stats.totalStock} units`}
              tone="sage"
            />
            <StatRow
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label="Inventory value"
              value={formatKES(stats.totalValue)}
              tone="pink"
            />
          </Card>

          {/* Website */}
          {website && (
            <Card title="Website">
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 hover:underline break-all"
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {website}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </Card>
          )}

          {/* Timestamps */}
          <Card title="Activity">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-ink-600">
                <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0 text-ink-400" />
                <div>
                  <p className="text-ink-500">Created</p>
                  <p className="font-medium text-ink-800">
                    {formatDate((brand as any).createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-ink-600">
                <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-ink-400" />
                <div>
                  <p className="text-ink-500">Last updated</p>
                  <p className="font-medium text-ink-800">
                    {formatDate((brand as any).updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* ═══ Delete confirmation ═══ */}
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
              Delete <strong>&ldquo;{brand.name}&rdquo;</strong> permanently?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="h-10 px-4 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="h-10 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border-2 border-cream-300 bg-white p-5">
      <header className="flex items-center gap-2 mb-4">
        {icon && <span className="text-ink-400">{icon}</span>}
        <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-cream-300 bg-white p-4">
      <h3 className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "sage" | "pink" | "blue";
}) {
  const toneClass = {
    default: "text-ink-900",
    sage: "text-sage-700",
    pink: "text-pink-700",
    blue: "text-blue-700",
  }[tone];

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-ink-500">
        <span className="text-ink-400">{icon}</span>
        {label}
      </span>
      <span className={cn("font-semibold", toneClass)}>{value}</span>
    </div>
  );
}