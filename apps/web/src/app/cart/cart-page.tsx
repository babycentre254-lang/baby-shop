"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Shield,
  Loader2,
  AlertTriangle,
  Package,
  Info,
  LogIn,
  Scale,
} from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/hooks/use-cart";
import { cn, formatKES } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartPage() {
  const router = useRouter();
  const {
    cart,
    isLoading,
    updateItem,
    removeItem,
    isUpdating,
    isRemoving,
    isAuthenticated,
  } = useCart();
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center gap-2 text-ink-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your cart…
        </div>
      </div>
    );
  }

  // ─── Empty ───
  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="rounded-3xl border-2 border-dashed border-cream-300 bg-white p-10 md:p-16 text-center">
          <div className="h-20 w-20 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="h-9 w-9 text-ink-400" />
          </div>
          <h1 className="font-display text-3xl text-ink-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-ink-500 max-w-md mx-auto mb-8">
            Looks like you haven't added anything yet. Browse our collection to
            find the perfect items for your little one.
          </p>
          <Button size="lg" asChild>
            <Link href="/products">
              Start shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { items, subtotal, itemCount, totalWeightGrams } = cart;

  async function handleQuantityChange(itemId: string, next: number) {
    if (next < 1) return;
    setBusyItemId(itemId);
    try {
      await updateItem(itemId, next);
    } catch (err) {
      console.error(err);
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleRemove(itemId: string) {
    setBusyItemId(itemId);
    try {
      await removeItem(itemId);
    } catch (err) {
      console.error(err);
    } finally {
      setBusyItemId(null);
    }
  }

  // Display weight in kg with 2 decimals when ≥1kg, otherwise grams
  const weightLabel =
    totalWeightGrams >= 1000
      ? `${(totalWeightGrams / 1000).toFixed(2)} kg`
      : `${totalWeightGrams} g`;

  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-ink-400 mb-4">
          <Link href="/" className="hover:text-blue-500">
            Home
          </Link>
          <span className="text-ink-300">/</span>
          <span className="text-ink-800">Cart</span>
        </nav>

        {/* Title */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-ink-900">
              Shopping Cart
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue shopping
          </Link>
        </div>

        {/* Guest hint banner */}
        {!isAuthenticated && (
          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <LogIn className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">
                Your cart is saved on this device
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                <Link
                  href="/login?next=/cart"
                  className="underline font-semibold"
                >
                  Sign in
                </Link>{" "}
                to save it to your account and check out faster.
              </p>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Items panel */}
          <div className="rounded-2xl border border-cream-200 bg-white overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_120px_140px_100px_40px] gap-3 px-5 py-3 border-b border-cream-200 bg-cream-50 text-[10px] font-semibold text-ink-500 uppercase tracking-wider">
              <span>Product</span>
              <span className="text-center">Price</span>
              <span className="text-center">Quantity</span>
              <span className="text-right">Total</span>
              <span></span>
            </div>

            <ul className="divide-y divide-cream-200">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  busy={busyItemId === item.id || isUpdating || isRemoving}
                  onChangeQuantity={(next) =>
                    handleQuantityChange(item.id, next)
                  }
                  onRemove={() => handleRemove(item.id)}
                />
              ))}
            </ul>
          </div>

          {/* Summary panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <div className="rounded-2xl border border-cream-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <SummaryRow
                  label={`Subtotal (${itemCount} ${
                    itemCount === 1 ? "item" : "items"
                  })`}
                  value={formatKES(subtotal)}
                />

                {/* Weight is informational only */}
                {totalWeightGrams > 0 && (
                  <div className="flex items-center justify-between text-xs text-ink-500 pt-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-ink-400" />
                      Estimated weight
                    </span>
                    <span className="font-medium text-ink-700">
                      {weightLabel}
                    </span>
                  </div>
                )}

                <div className="border-t border-cream-200 pt-3 mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-ink-900">Subtotal</span>
                    <span className="font-display text-2xl font-semibold text-ink-900">
                      {formatKES(subtotal)}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-500 mt-1.5 flex items-center gap-1">
                    <Info className="h-3 w-3 shrink-0" />
                    Shipping calculated at checkout
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-5"
                onClick={() => router.push("/checkout")}
              >
                Proceed to checkout
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-500">
                <Shield className="h-3 w-3 text-sage-500" />
                Secure checkout · M-Pesa or Cash on Delivery
              </div>
            </div>

            {/* Payment methods */}
            <div className="rounded-2xl border border-cream-200 bg-white p-4">
              <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider mb-3">
                We accept
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-200">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold text-green-700">
                    M-Pesa
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cream-50 border border-cream-200">
                  <Package className="h-3 w-3 text-ink-600" />
                  <span className="text-xs font-semibold text-ink-700">
                    Cash on Delivery
                  </span>
                </span>
              </div>
            </div>

            {/* Trust */}
            <div className="rounded-2xl border border-cream-200 bg-white p-4 space-y-3">
              <TrustRow
                icon={<Shield className="h-3.5 w-3.5" />}
                text="Safe, certified products"
              />
              <TrustRow
                icon={<Info className="h-3.5 w-3.5" />}
                text="30-day returns on unopened items"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Cart item row
// ═══════════════════════════════════════════════════════════

function CartItemRow({
  item,
  busy,
  onChangeQuantity,
  onRemove,
}: {
  item: any;
  busy: boolean;
  onChangeQuantity: (next: number) => void;
  onRemove: () => void;
}) {
  const [optimisticQty, setOptimisticQty] = useState<number | null>(null);
  const qty = optimisticQty ?? item.quantity;

  const maxStock = item.availableStock ?? 999;
  const atMax = qty >= maxStock;
  const outOfStock = maxStock === 0;
  const lowStock = maxStock > 0 && maxStock <= 5;

  return (
    <li
      className={cn(
        "grid grid-cols-1 sm:grid-cols-[1fr_120px_140px_100px_40px] gap-3 sm:items-center px-4 sm:px-5 py-4 transition-opacity",
        busy && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <Link
          href={`/products/${item.product.slug}`}
          className="h-20 w-20 rounded-xl bg-cream-100 border border-cream-200 overflow-hidden shrink-0 relative"
        >
          {item.product.image ? (
            <Image
              src={item.product.image}
              alt={item.product.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-cream-400">
              <Package className="h-6 w-6" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/products/${item.product.slug}`}
            className="text-sm font-medium text-ink-900 hover:text-blue-600 transition-colors line-clamp-2"
          >
            {item.product.name}
          </Link>
          <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-ink-500">
            {item.variant.size && <span>Size: {item.variant.size}</span>}
            {item.variant.size && item.variant.color && (
              <span className="text-ink-300">·</span>
            )}
            {item.variant.color && <span>Color: {item.variant.color}</span>}
          </div>
          <p className="mt-1 text-[10px] font-mono text-ink-400 truncate">
            {item.variant.sku}
          </p>

          <p className="sm:hidden mt-1.5 text-sm font-semibold text-ink-900">
            {formatKES(item.unitPrice)}
          </p>

          {lowStock && (
            <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-yellow-700">
              <AlertTriangle className="h-3 w-3" />
              Only {maxStock} left in stock
            </p>
          )}
          {outOfStock && (
            <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-pink-600">
              <AlertTriangle className="h-3 w-3" />
              Out of stock
            </p>
          )}
        </div>
      </div>

      <div className="hidden sm:block text-center text-sm text-ink-700">
        {formatKES(item.unitPrice)}
      </div>

      <div className="flex items-center justify-start sm:justify-center">
        <div className="inline-flex items-center rounded-lg border border-cream-300 bg-white overflow-hidden">
          <button
            onClick={() => {
              if (qty <= 1) return;
              setOptimisticQty(qty - 1);
              onChangeQuantity(qty - 1);
            }}
            disabled={busy || qty <= 1}
            className="h-8 w-8 flex items-center justify-center text-ink-600 hover:bg-cream-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="h-8 min-w-9 px-2 flex items-center justify-center text-sm font-medium text-ink-900 border-x border-cream-200">
            {qty}
          </span>
          <button
            onClick={() => {
              if (atMax) return;
              setOptimisticQty(qty + 1);
              onChangeQuantity(qty + 1);
            }}
            disabled={busy || atMax}
            className="h-8 w-8 flex items-center justify-center text-ink-600 hover:bg-cream-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="text-left sm:text-right">
        <span className="text-sm font-semibold text-ink-900">
          {formatKES(item.lineTotal)}
        </span>
      </div>

      <div className="flex justify-start sm:justify-end">
        <button
          onClick={onRemove}
          disabled={busy}
          aria-label="Remove item"
          className="h-8 w-8 rounded-lg text-ink-400 hover:text-pink-600 hover:bg-pink-50 flex items-center justify-center transition-colors disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}

function TrustRow({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-600">
      <span className="text-sage-600">{icon}</span>
      {text}
    </div>
  );
}