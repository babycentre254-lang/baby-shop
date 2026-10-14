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
  Star,
  Eye,
  EyeOff,
  Package,
  Boxes,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Tag,
  Award,
  Shield,
  Sparkles,
} from "lucide-react";

import { productsApi } from "@/lib/api/endpoints";
import { cn, formatKES, formatDate } from "@/lib/utils";
import type { Product } from "@baby-shop/shared";

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const qc = useQueryClient();

  const [activeImage, setActiveImage] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllVariants, setShowAllVariants] = useState(false);

  const variants = (product as any).variants ?? [];
  const images = (product as any).images ?? [];
  const isPublished = (product as any).isPublished;
  const isFeatured = (product as any).isFeatured;
  const salePrice = (product as any).salePrice;
  const hasSale = salePrice != null && salePrice < product.basePrice;

  const totalStock = variants.reduce(
    (s: number, v: any) => s + (v.stock || 0),
    0
  );
  const totalValue = variants.reduce(
    (s: number, v: any) => s + (v.stock || 0) * (v.price || 0),
    0
  );
  const lowStock = variants.filter(
    (v: any) => v.stock > 0 && v.stock <= (v.lowStockAt ?? 5)
  ).length;
  const outOfStock = variants.filter((v: any) => v.stock === 0).length;

  const shownVariants = showAllVariants ? variants : variants.slice(0, 6);

  // ─── Delete ───
  const deleteMutation = useMutation({
    mutationFn: () => productsApi.remove(product._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      router.push("/dashboard/products");
      router.refresh();
    },
    onError: (err: any) => {
      setError(err?.message ?? "Could not delete product");
      setConfirmDelete(false);
    },
  });

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  const activeImageUrl = images[activeImage]?.url;

  return (
    <div className="pb-24 lg:pb-0">
      {/* ═══ Header ═══ */}
      <div className="mb-6">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-ink-900">
                {product.name}
              </h1>
              {isFeatured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                  <Star className="h-3 w-3 fill-yellow-600 text-yellow-600" />
                  Featured
                </span>
              )}
              {isPublished ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sage-100 text-sage-700 text-xs font-semibold">
                  <Eye className="h-3 w-3" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream-200 text-ink-600 text-xs font-semibold">
                  <EyeOff className="h-3 w-3" />
                  Draft
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3 flex-wrap text-xs">
              <button
                onClick={() => copy(product.slug, "slug")}
                className="inline-flex items-center gap-1 text-ink-500 hover:text-blue-600 font-mono bg-cream-50 border border-cream-200 px-2 py-0.5 rounded transition-colors"
              >
                /{product.slug}
                {copiedId === "slug" ? (
                  <Check className="h-3 w-3 text-sage-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>

              <button
                onClick={() => copy((product as any).sku, "sku")}
                className="inline-flex items-center gap-1 text-ink-500 hover:text-blue-600 font-mono bg-cream-50 border border-cream-200 px-2 py-0.5 rounded transition-colors"
              >
                SKU: {(product as any).sku}
                {copiedId === "sku" ? (
                  <Check className="h-3 w-3 text-sage-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>

              {isPublished && (
                <Link
                  href={`http://localhost:3000/products/${product.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600"
                >
                  View on storefront
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmDelete(true)}
              className="h-10 w-10 rounded-xl border-2 border-cream-300 text-pink-600 hover:bg-pink-50 hover:border-pink-300 flex items-center justify-center transition-colors"
              aria-label="Delete product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <Link
              href={`/dashboard/products/${product._id}/edit`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit product
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
          {/* Image gallery */}
          {images.length > 0 && (
            <Section title="Images" icon={<ImageIcon className="h-4 w-4" />}>
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-2xl bg-cream-100 border-2 border-cream-200 overflow-hidden relative">
                  <Image
                    src={images[activeImage]?.url}
                    alt={images[activeImage]?.altText || product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-contain"
                    priority
                  />
                  {hasSale && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-pink-500 text-white text-xs font-bold">
                      -
                      {Math.round(
                        ((product.basePrice - salePrice!) / product.basePrice) *
                          100
                      )}
                      % off
                    </span>
                  )}

                  {/* Nav arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveImage(
                            (activeImage - 1 + images.length) % images.length
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 hover:bg-white text-ink-800 flex items-center justify-center shadow-lg transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveImage((activeImage + 1) % images.length)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 hover:bg-white text-ink-800 flex items-center justify-center shadow-lg transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Counter */}
                  <span className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-ink-900/70 text-white text-xs font-medium">
                    {activeImage + 1} / {images.length}
                  </span>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    {images.map((img: any, i: number) => (
                      <button
                        key={img._id ?? i}
                        onClick={() => setActiveImage(i)}
                        className={cn(
                          "aspect-square rounded-lg border-2 overflow-hidden relative transition-all",
                          i === activeImage
                            ? "border-blue-500 ring-2 ring-blue-100"
                            : "border-cream-200 hover:border-blue-300"
                        )}
                      >
                        <Image
                          src={img.url}
                          alt={img.altText || `Image ${i + 1}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Description */}
          {product.description && (
            <Section title="Description" icon={<Sparkles className="h-4 w-4" />}>
              <div
                className="prose-rich text-sm text-ink-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </Section>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <Section
              title={`Variants (${variants.length})`}
              icon={<Boxes className="h-4 w-4" />}
            >
              <div className="rounded-2xl border-2 border-cream-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-50 border-b border-cream-200">
                      <tr className="text-left text-xs uppercase tracking-wider text-ink-500">
                        <th className="px-3 py-2.5 font-semibold">SKU</th>
                        <th className="px-3 py-2.5 font-semibold">Size</th>
                        <th className="px-3 py-2.5 font-semibold">Color</th>
                        <th className="px-3 py-2.5 font-semibold text-right">
                          Price
                        </th>
                        <th className="px-3 py-2.5 font-semibold text-right">
                          Stock
                        </th>
                        <th className="px-3 py-2.5 font-semibold text-right">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownVariants.map((v: any) => {
                        const stockTone =
                          v.stock === 0
                            ? "text-pink-600"
                            : v.stock <= (v.lowStockAt ?? 5)
                            ? "text-yellow-700"
                            : "text-sage-600";
                        return (
                          <tr
                            key={v._id ?? v.sku}
                            className="border-b border-cream-100 last:border-0"
                          >
                            <td className="px-3 py-2.5">
                              <span className="font-mono text-xs text-ink-700">
                                {v.sku}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-ink-700">
                              {v.size || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-ink-700">
                              {v.color || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-ink-900">
                              {formatKES(v.price)}
                            </td>
                            <td
                              className={cn(
                                "px-3 py-2.5 text-right font-medium",
                                stockTone
                              )}
                            >
                              {v.stock}
                            </td>
                            <td className="px-3 py-2.5 text-right text-ink-600">
                              {formatKES(v.stock * v.price)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {variants.length > 6 && (
                  <button
                    onClick={() => setShowAllVariants((v) => !v)}
                    className="w-full py-2.5 text-xs font-medium text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border-t border-cream-200"
                  >
                    {showAllVariants
                      ? "Show fewer"
                      : `Show all ${variants.length} variants`}
                  </button>
                )}
              </div>
            </Section>
          )}

          {/* SEO preview */}
          <Section title="SEO Preview" icon={<Search className="h-4 w-4" />}>
            <div className="rounded-xl border border-cream-200 bg-white p-4">
              <p className="text-[11px] text-ink-800 leading-tight">
                BabyCentre
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                babycentre.co.ke › products › {product.slug}
              </p>
              <p className="text-base text-blue-700 mt-1.5 hover:underline cursor-pointer line-clamp-1">
                {(product as any).metaTitle || `${product.name} | BabyCentre`}
              </p>
              <p className="text-xs text-ink-600 line-clamp-2 mt-0.5">
                {(product as any).metaDescription ||
                  (product as any).shortDesc ||
                  product.description?.replace(/<[^>]+>/g, "").slice(0, 160)}
              </p>
            </div>
          </Section>
        </div>

        {/* ─── Right column ─── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Stats */}
          <Card title="Inventory">
            <StatRow
              icon={<Boxes className="h-3.5 w-3.5" />}
              label="Total stock"
              value={`${totalStock} units`}
              tone={outOfStock > 0 ? "yellow" : "sage"}
            />
            <StatRow
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label="Inventory value"
              value={formatKES(totalValue)}
              tone="blue"
            />
            <StatRow
              icon={<Layers className="h-3.5 w-3.5" />}
              label="Variants"
              value={String(variants.length)}
            />
            {lowStock > 0 && (
              <StatRow
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                label="Low stock"
                value={`${lowStock} variant${lowStock !== 1 ? "s" : ""}`}
                tone="yellow"
              />
            )}
            {outOfStock > 0 && (
              <StatRow
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                label="Out of stock"
                value={`${outOfStock} variant${outOfStock !== 1 ? "s" : ""}`}
                tone="pink"
              />
            )}
          </Card>

          {/* Pricing */}
          <Card title="Pricing">
            <div className="space-y-2">
              {hasSale ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-ink-900">
                      {formatKES(salePrice!)}
                    </span>
                    <span className="text-sm text-ink-400 line-through">
                      {formatKES(product.basePrice)}
                    </span>
                  </div>
                  <p className="text-xs text-pink-600 font-medium">
                    {Math.round(
                      ((product.basePrice - salePrice!) / product.basePrice) *
                        100
                    )}
                    % off — save{" "}
                    {formatKES(product.basePrice - salePrice!)}
                  </p>
                </>
              ) : (
                <span className="text-2xl font-bold text-ink-900">
                  {formatKES(product.basePrice)}
                </span>
              )}
            </div>
          </Card>

          {/* Details */}
          <Card title="Details">
            {(product as any).categoryId && (
              <DetailRow
                icon={<Layers className="h-3.5 w-3.5" />}
                label="Category"
                value={(product as any).categoryId?.name ?? "—"}
              />
            )}
            {(product as any).brandId && (
              <DetailRow
                icon={<Award className="h-3.5 w-3.5" />}
                label="Brand"
                value={(product as any).brandId?.name ?? "—"}
              />
            )}
            {(product as any).ageRange && (
              <DetailRow
                icon={<Tag className="h-3.5 w-3.5" />}
                label="Age range"
                value={(product as any).ageRange}
              />
            )}
            {(product as any).material && (
              <DetailRow
                icon={<Package className="h-3.5 w-3.5" />}
                label="Material"
                value={(product as any).material}
              />
            )}
          </Card>

          {/* Certifications */}
          {(product as any).safetyCerts?.length > 0 && (
            <Card title="Safety certifications">
              <div className="flex flex-wrap gap-1.5">
                {(product as any).safetyCerts.map((cert: string) => (
                  <span
                    key={cert}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200"
                  >
                    <Shield className="h-2.5 w-2.5" />
                    {cert}
                  </span>
                ))}
              </div>
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
                    {formatDate((product as any).createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-ink-600">
                <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-ink-400" />
                <div>
                  <p className="text-ink-500">Last updated</p>
                  <p className="font-medium text-ink-800">
                    {formatDate((product as any).updatedAt)}
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
              <h3 className="font-semibold text-ink-900">Delete product?</h3>
            </div>
            <p className="text-sm text-ink-600 mb-5">
              Delete <strong>&ldquo;{product.name}&rdquo;</strong> permanently?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="h-10 px-4 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:bg-cream-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="h-10 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
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
  tone?: "default" | "sage" | "yellow" | "pink" | "blue";
}) {
  const toneClass = {
    default: "text-ink-900",
    sage: "text-sage-700",
    yellow: "text-yellow-700",
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

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-ink-500 shrink-0">
        <span className="text-ink-400">{icon}</span>
        {label}
      </span>
      <span className="font-medium text-ink-800 text-right truncate">
        {value}
      </span>
    </div>
  );
}