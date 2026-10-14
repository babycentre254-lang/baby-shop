"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, ShoppingBag, Star, Check } from "lucide-react";
import { cn, formatKES } from "@/lib/utils";
import { useCart } from "@/lib/hooks/use-cart";
import type { Product } from "@baby-shop/shared";

interface Props {
  product: Product & {
    salePrice?: number | null;
    isFeatured?: boolean;
    isPublished?: boolean;
    ageRange?: string;
    ratingAverage?: number;
    ratingCount?: number;
    images?: { url: string; altText?: string }[];
    variants?: {
      _id: string;
      sku: string;
      size?: string;
      color?: string;
      price: number;
      stock: number;
    }[];
  };
  priority?: boolean;
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

export function ProductCard({ product, priority }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();

  const image = product.images?.[0]?.url;
  const alt = product.images?.[0]?.altText || product.name;
  const price = product.salePrice ?? product.basePrice;
  const hasSale =
    product.salePrice != null && product.salePrice < product.basePrice;
  const discountPct = hasSale
    ? Math.round(
        ((product.basePrice - product.salePrice!) / product.basePrice) * 100
      )
    : 0;
  const ratingAverage = Math.min(
    5,
    Math.max(0, Number((product as any).ratingAverage ?? (product as any).averageRating ?? 0))
  );
  const ratingCount = Math.max(
    0,
    Number((product as any).ratingCount ?? (product as any).reviewCount ?? 0)
  );

  const variants = product.variants ?? [];
  const inStock = variants.length === 0 || variants.some((v) => v.stock > 0);
  const totalStock = variants.reduce((s, v) => s + (v.stock || 0), 0);
  const isLowStock = totalStock > 0 && totalStock <= 5;

  const colors = Array.from(
    new Set(variants.map((v) => v.color).filter(Boolean))
  ) as string[];
  const visibleColors = colors.slice(0, 4);
  const extraColorCount = Math.max(0, colors.length - visibleColors.length);

  const firstAvailableVariant = variants.find((v) => v.stock > 0);

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!firstAvailableVariant || !inStock) return;
    try {
      await addItem({
        variantId: firstAvailableVariant._id,
        quantity: 1,
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0]?.url,
        },
        variant: {
          sku: firstAvailableVariant.sku,
          size: firstAvailableVariant.size,
          color: firstAvailableVariant.color,
        },
        unitPrice: firstAvailableVariant.price,
        availableStock: firstAvailableVariant.stock,
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } catch {
      // error surfaces on cart page
    }
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((v) => !v);
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group flex flex-col h-full",
        "rounded-xl bg-white border border-cream-100 overflow-hidden",
        "transition-all duration-200",
        "hover:border-blue-200 hover:shadow-md"
      )}
    >
      {/* ═══ Image (square, compact) ═══ */}
      <div className="relative aspect-square overflow-hidden bg-cream-50">
        {image ? (
          <Image
            src={image}
            alt={alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-[1.06]",
              !imageLoaded && "opacity-0"
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-cream-300">
            <span className="text-5xl font-display">B</span>
          </div>
        )}

        {!imageLoaded && image && (
          <div className="absolute inset-0 bg-cream-100 animate-pulse" />
        )}

        {/* ─── Top-left: discounts + featured star ─── */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {hasSale && discountPct > 0 && (
            <span className="inline-flex items-center rounded-md bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 shadow-sm">
              -{discountPct}%
            </span>
          )}
          {product.isFeatured && (
            <span
              className="inline-flex items-center justify-center rounded-md bg-yellow-400 text-white h-5 w-5 shadow-sm"
              title="Featured"
            >
              <Star className="h-3 w-3 fill-white" />
            </span>
          )}
        </div>

        {/* ─── Top-right: wishlist ─── */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute top-2 right-2 h-8 w-8 rounded-full bg-white/95 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-sm transition-all",
            "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-0.5 md:group-hover:translate-y-0"
          )}
        >
          <Heart
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              wishlisted ? "text-pink-500 fill-pink-500" : "text-ink-700"
            )}
          />
        </button>

        {/* ─── Bottom-left: stock urgency ─── */}
        {isLowStock && inStock && (
          <span className="absolute bottom-2 left-2 inline-flex items-center rounded-md bg-yellow-500/95 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 shadow-sm">
            Only {totalStock} left
          </span>
        )}

        {/* ─── Quick add (hover only) ─── */}
        {inStock && (
          <button
            onClick={handleQuickAdd}
            aria-label="Add to cart"
            className={cn(
              "absolute bottom-2 right-2 h-9 w-9 rounded-full flex items-center justify-center shadow-lg transition-all",
              justAdded
                ? "bg-sage-500 text-white"
                : "bg-ink-900/90 hover:bg-blue-500 text-white backdrop-blur-sm",
              "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
            )}
          >
            {justAdded ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
          </button>
        )}

        {/* ─── Out of stock overlay ─── */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="inline-flex items-center rounded-md bg-ink-900 text-white text-[11px] font-semibold px-2.5 py-1 shadow">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* ═══ Info ═══ */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        {/* Age range */}
        {product.ageRange && (
          <span className="text-[10px] font-medium text-ink-400 uppercase tracking-wide">
            {product.ageRange}
          </span>
        )}

        {/* Name */}
        <h3 className="text-[13px] font-medium text-ink-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Show real ratings when supplied; products without reviews stay clearly unrated. */}
        <div
          className="flex min-h-4 items-center gap-1"
          aria-label={
            ratingCount > 0
              ? `Rated ${ratingAverage.toFixed(1)} out of 5 from ${ratingCount} reviews`
              : "No reviews yet"
          }
        >
          <span className="flex items-center gap-px" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => {
              const filled = ratingCount > 0 && index < Math.round(ratingAverage);
              return (
                <Star
                  key={index}
                  className={cn(
                    "h-3 w-3",
                    filled
                      ? "fill-amber-400 text-amber-500"
                      : "fill-none text-amber-500/50"
                  )}
                />
              );
            })}
          </span>
          <span className="text-[10px] text-ink-500">
            {ratingCount > 0
              ? `${ratingAverage.toFixed(1)} (${ratingCount})`
              : "No reviews"}
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-auto pt-1">
          <span className="font-display text-base font-semibold text-ink-900 leading-none">
            {formatKES(price)}
          </span>
          {hasSale && (
            <span className="text-[11px] text-ink-400 line-through">
              {formatKES(product.basePrice)}
            </span>
          )}
        </div>

        {/* Color dots */}
        {visibleColors.length > 0 && (
          <div className="flex items-center gap-1 pt-0.5">
            {visibleColors.map((c) => (
              <span
                key={c}
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: COLOR_HEX[c] ?? "#E5E7EB",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
                }}
                title={c}
              />
            ))}
            {extraColorCount > 0 && (
              <span className="text-[10px] font-medium text-ink-400 ml-0.5">
                +{extraColorCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
