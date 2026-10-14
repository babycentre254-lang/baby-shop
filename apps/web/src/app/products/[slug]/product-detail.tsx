"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Home,
  ChevronRight,
  Star,
  Heart,
  ShoppingBag,
  Zap,
  Minus,
  Plus,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Package,
  ChevronDown,
  Share2,
  Award,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { cn, formatKES } from "@/lib/utils";
import { useCart } from "@/lib/hooks/use-cart";
import { ProductCard } from "../product-card";
import { Button } from "@/components/ui/button";
import type { Product } from "@baby-shop/shared";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

interface Props {
  product: Product & {
    salePrice?: number | null;
    shortDesc?: string;
    ageRange?: string;
    material?: string;
    safetyCerts?: string[];
    images?: { _id?: string; url: string; altText?: string }[];
    variants?: {
      _id: string;
      sku: string;
      size?: string;
      color?: string;
      price: number;
      stock: number;
      lowStockAt?: number;
    }[];
    categoryId?: any;
    brandId?: any;
    metaTitle?: string;
    metaDescription?: string;
  };
  related: Product[];
}

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
};

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function ProductDetail({ product, related }: Props) {
  const router = useRouter();
  const { addItem } = useCart();

  const variants = product.variants ?? [];
  const images = product.images ?? [];

  const [activeImage, setActiveImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Derive unique sizes & colors
  const sizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[],
    [variants]
  );
  const colors = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[],
    [variants]
  );

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length === 1 ? sizes[0] : null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors.length === 1 ? colors[0] : null
  );

  // Find the variant matching current selections
  const selectedVariant = useMemo(() => {
    return variants.find(
      (v) =>
        (!selectedSize || v.size === selectedSize) &&
        (!selectedColor || v.color === selectedColor)
    );
  }, [variants, selectedSize, selectedColor]);

  const price =
    selectedVariant?.price ??
    product.salePrice ??
    product.basePrice;
  const comparePrice = product.salePrice
    ? product.basePrice
    : selectedVariant?.price && selectedVariant.price < product.basePrice
    ? product.basePrice
    : null;

  const hasSale = comparePrice != null && comparePrice > price;
  const discountPct = hasSale
    ? Math.round(((comparePrice! - price) / comparePrice!) * 100)
    : 0;

  const stock = selectedVariant?.stock ?? 0;
  const lowStockAt = selectedVariant?.lowStockAt ?? 5;
  const isLowStock = stock > 0 && stock <= lowStockAt;
  const inStock = stock > 0;

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Check if a size is available for the currently selected color
  function isSizeAvailable(size: string): boolean {
    return variants.some(
      (v) =>
        v.size === size &&
        (!selectedColor || v.color === selectedColor) &&
        v.stock > 0
    );
  }

  function isColorAvailable(color: string): boolean {
    return variants.some(
      (v) =>
        v.color === color &&
        (!selectedSize || v.size === selectedSize) &&
        v.stock > 0
    );
  }

  // Determine if user must pick a variant before adding
  const needsVariantSelection =
    variants.length > 0 &&
    (!selectedVariant || (sizes.length > 0 && !selectedSize) || (colors.length > 0 && !selectedColor));

async function handleAdd() {
  if (!selectedVariant || !inStock) return;
  setAdding(true);
  try {
    await addItem({
      variantId: selectedVariant._id,
      quantity,
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: images[0]?.url,
      },
      variant: {
        sku: selectedVariant.sku,
        size: selectedVariant.size,
        color: selectedVariant.color,
      },
      unitPrice: selectedVariant.price,
      availableStock: selectedVariant.stock,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  } catch (err) {
    console.error(err);
  } finally {
    setAdding(false);
  }
}

async function handleBuyNow() {
  if (!selectedVariant || !inStock) return;
  setBuying(true);
  try {
    await addItem({
      variantId: selectedVariant._id,
      quantity,
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: images[0]?.url,
      },
      variant: {
        sku: selectedVariant.sku,
        size: selectedVariant.size,
        color: selectedVariant.color,
      },
      unitPrice: selectedVariant.price,
      availableStock: selectedVariant.stock,
    });
    router.push("/checkout");
  } catch (err) {
    console.error(err);
    setBuying(false);
  }
}

  const brandName = product.brandId?.name ?? null;
  const brandSlug = product.brandId?.slug ?? null;
  const categoryName = product.categoryId?.name ?? null;
  const categorySlug = product.categoryId?.slug ?? null;

  const activeImageUrl = images[activeImage]?.url;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* ═══ Breadcrumb ═══ */}
        <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-ink-400 mb-4 flex-wrap">
          <Link href="/" className="flex items-center gap-1.5 hover:text-blue-500">
            <Home className="h-3 w-3" />
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-ink-300" />
          <Link href="/products" className="hover:text-blue-500">
            Shop
          </Link>
          {categoryName && (
            <>
              <ChevronRight className="h-3 w-3 text-ink-300" />
              <Link
                href={`/products?category=${categorySlug}`}
                className="hover:text-blue-500"
              >
                {categoryName}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 text-ink-300" />
          <span className="text-ink-800 truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* ═══ Main grid ═══ */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* ─── Left: image gallery ─── */}
          <div className="space-y-3">
            <div className="aspect-square rounded-3xl bg-cream-50 border border-cream-200 overflow-hidden relative">
              {activeImageUrl ? (
                <Image
                  src={activeImageUrl}
                  alt={images[activeImage]?.altText || product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-cream-300">
                  <ImageIcon className="h-20 w-20" />
                </div>
              )}

              {hasSale && discountPct > 0 && (
                <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-pink-500 text-white text-xs font-bold px-3 py-1.5 shadow-md">
                  -{discountPct}%
                </span>
              )}

              {!inStock && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                  <span className="inline-flex items-center rounded-full bg-ink-900 text-white text-sm font-semibold px-4 py-2 shadow-lg">
                    Out of stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={img._id ?? i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "aspect-square rounded-xl border-2 overflow-hidden relative transition-all",
                      i === activeImage
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : "border-cream-200 hover:border-blue-300"
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || `${product.name} ${i + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Right: info & purchase ─── */}
          <div className="space-y-5">
            {/* Brand pill */}
            {brandName && brandSlug && (
              <Link
                href={`/products?brand=${brandSlug}`}
                className="inline-flex items-center gap-2 h-8 pl-1 pr-3 rounded-full bg-cream-50 hover:bg-cream-100 border border-cream-200 transition-colors group"
              >
                <span className="h-6 w-6 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {brandName.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-medium text-ink-700 group-hover:text-blue-600">
                  {brandName}
                </span>
                <ExternalLink className="h-3 w-3 text-ink-400" />
              </Link>
            )}

            {/* Product name */}
            <div>
              <h1 className="font-display text-2xl md:text-3xl text-ink-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating placeholder */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        "fill-none text-amber-500/50"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-ink-500">
                  No reviews yet
                </span>
                {product.ageRange && (
                  <>
                    <span className="text-ink-300">·</span>
                    <span className="text-xs text-ink-500">
                      For {product.ageRange}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-3xl font-semibold text-ink-900">
                {formatKES(price)}
              </span>
              {hasSale && (
                <>
                  <span className="text-base text-ink-400 line-through">
                    {formatKES(comparePrice!)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-pink-100 text-pink-700 text-[11px] font-bold px-2 py-0.5">
                    Save {formatKES(comparePrice! - price)}
                  </span>
                </>
              )}
            </div>

            {product.shortDesc && (
              <p className="text-sm text-ink-600 leading-relaxed">
                {product.shortDesc}
              </p>
            )}

            {/* ─── Color picker ─── */}
            {colors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">
                    Color
                  </span>
                  <span className="text-xs text-ink-700 font-medium">
                    {selectedColor || "Select"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const available = isColorAvailable(c);
                    const selected = selectedColor === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        disabled={!available}
                        className={cn(
                          "h-9 w-9 rounded-full flex items-center justify-center transition-all relative",
                          selected
                            ? "ring-2 ring-blue-500 ring-offset-2"
                            : "ring-1 ring-cream-300 hover:ring-blue-300",
                          !available && "opacity-40 cursor-not-allowed"
                        )}
                        title={`${c}${!available ? " (unavailable)" : ""}`}
                      >
                        <span
                          className="h-7 w-7 rounded-full border border-white shadow-inner"
                          style={{
                            backgroundColor: COLOR_HEX[c] ?? "#E5E7EB",
                          }}
                        />
                        {selected && (
                          <Check className="absolute h-3.5 w-3.5 text-white drop-shadow-md" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Size picker ─── */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">
                    Size
                  </span>
                  <span className="text-xs text-ink-700 font-medium">
                    {selectedSize || "Select"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const available = isSizeAvailable(s);
                    const selected = selectedSize === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        disabled={!available}
                        className={cn(
                          "h-10 px-4 rounded-xl border-2 text-sm font-medium transition-all relative",
                          selected
                            ? "bg-ink-900 text-white border-ink-900"
                            : available
                            ? "bg-white text-ink-700 border-cream-300 hover:border-blue-300"
                            : "bg-cream-50 text-ink-300 border-cream-200 cursor-not-allowed line-through"
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Stock status ─── */}
            {selectedVariant && (
              <div>
                {inStock ? (
                  isLowStock ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Only {stock} left — order soon
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-700 bg-sage-50 border border-sage-200 rounded-lg px-2.5 py-1.5">
                      <Check className="h-3.5 w-3.5" />
                      In stock ({stock} available)
                    </div>
                  )
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-pink-700 bg-pink-50 border border-pink-200 rounded-lg px-2.5 py-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Out of stock
                  </div>
                )}
              </div>
            )}

            {needsVariantSelection && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                Please select
                {colors.length > 0 && !selectedColor && " a color"}
                {colors.length > 0 && sizes.length > 0 && " and"}
                {sizes.length > 0 && !selectedSize && " a size"}
                {" to continue"}
              </div>
            )}

            {/* ─── Quantity + actions ─── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="inline-flex items-center rounded-xl border-2 border-cream-300 bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="h-10 w-10 flex items-center justify-center text-ink-600 hover:bg-cream-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="h-10 min-w-12 flex items-center justify-center text-sm font-semibold text-ink-900 border-x border-cream-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        selectedVariant ? Math.min(stock, q + 1) : q + 1
                      )
                    }
                    disabled={selectedVariant ? quantity >= stock : false}
                    className="h-10 w-10 flex items-center justify-center text-ink-600 hover:bg-cream-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAdd}
                  disabled={!selectedVariant || !inStock || adding}
                  className={cn(
                    "h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                    justAdded
                      ? "bg-sage-500 text-white"
                      : "bg-white border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : justAdded ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      Add to cart
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={!selectedVariant || !inStock || buying}
                  className={cn(
                    "h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                    "bg-gradient-to-r from-blue-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-pink-100",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {buying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Buy now
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setWishlisted((v) => !v)}
                className={cn(
                  "w-full h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  wishlisted
                    ? "bg-pink-50 text-pink-600 border border-pink-200"
                    : "text-ink-500 hover:text-ink-800 hover:bg-cream-50"
                )}
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    wishlisted && "fill-pink-500 text-pink-500"
                  )}
                />
                {wishlisted ? "Saved to wishlist" : "Add to wishlist"}
              </button>
            </div>

            {/* ─── Trust strip ─── */}
            <div className="pt-3 border-t border-cream-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TrustItem
                icon={<Truck className="h-4 w-4" />}
                title="Free delivery"
                subtitle="Orders over KSh 5,000"
              />
              <TrustItem
                icon={<Shield className="h-4 w-4" />}
                title="Safe materials"
                subtitle={
                  (product.safetyCerts ?? []).length > 0
                    ? (product.safetyCerts ?? []).slice(0, 2).join(", ")
                    : "Certified safe"
                }
              />
              <TrustItem
                icon={<RotateCcw className="h-4 w-4" />}
                title="Easy returns"
                subtitle="30-day window"
              />
            </div>
          </div>
        </div>

        {/* ═══ Description + Details (accordion-ish) ═══ */}
        <div className="border-t border-cream-200 pt-8 mb-12">
          <div className="grid lg:grid-cols-[1fr_320px] gap-10">
            {/* Description */}
            <div>
              <h2 className="text-[11px] font-semibold text-ink-500 uppercase tracking-[0.08em] mb-3">
                Description
              </h2>
              <div
                className="prose-rich text-sm text-ink-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>

            {/* Details sidebar */}
            <aside className="space-y-4">
              <div className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4 space-y-3">
                <h3 className="text-[11px] font-semibold text-ink-500 uppercase tracking-[0.08em]">
                  Details
                </h3>

                <DetailRow label="SKU" value={(product as any).sku || "—"} />
                {product.ageRange && (
                  <DetailRow label="Age range" value={product.ageRange} />
                )}
                {product.material && (
                  <DetailRow label="Material" value={product.material} />
                )}
                {categoryName && (
                  <DetailRow
                    label="Category"
                    value={
                      <Link
                        href={`/products?category=${categorySlug}`}
                        className="text-blue-500 hover:underline"
                      >
                        {categoryName}
                      </Link>
                    }
                  />
                )}
                {brandName && (
                  <DetailRow
                    label="Brand"
                    value={
                      <Link
                        href={`/products?brand=${brandSlug}`}
                        className="text-blue-500 hover:underline"
                      >
                        {brandName}
                      </Link>
                    }
                  />
                )}
                {(product.safetyCerts ?? []).length > 0 && (
                  <div className="pt-2 border-t border-cream-200">
                    <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-2">
                      Safety certifications
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.safetyCerts!.map((cert) => (
                        <span
                          key={cert}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5"
                        >
                          <Shield className="h-2.5 w-2.5" />
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* ═══ Related products ═══ */}
        {related.length > 0 && (
          <div className="border-t border-cream-200 pt-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl md:text-2xl text-ink-900">
                You may also like
              </h2>
              {categoryName && (
                <Link
                  href={`/products?category=${categorySlug}`}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                >
                  See all {categoryName} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p._id} product={p as any} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════

function TrustItem({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-900">{title}</p>
        <p className="text-[11px] text-ink-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-ink-500 shrink-0">{label}</span>
      <span className="font-medium text-ink-800 text-right truncate">
        {value}
      </span>
    </div>
  );
}
