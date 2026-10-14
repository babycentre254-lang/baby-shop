"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Shield,
  Loader2,
  Lock,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { formatKES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ShippingQuote } from "@baby-shop/shared";

interface Props {
  items: any[];
  subtotal: number;
  shippingQuote: ShippingQuote | null;
  shippingLoading: boolean;
  total: number;
  placing: boolean;
  canPlace: boolean;
  actionLabel: string;
  onPlace: () => void;
}

export function OrderSummary({
  items,
  subtotal,
  shippingQuote,
  shippingLoading,
  total,
  placing,
  canPlace,
  actionLabel,
  onPlace,
}: Props) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cream-200">
        <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider">
          Order Summary
        </h2>
        <p className="text-xs text-ink-500 mt-0.5">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Items (compact) */}
      <div className="max-h-72 overflow-y-auto divide-y divide-cream-100">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3">
            <div className="h-12 w-12 rounded-lg bg-cream-100 border border-cream-200 overflow-hidden relative shrink-0">
              {item.product.image ? (
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-cream-400">
                  <Package className="h-4 w-4" />
                </div>
              )}
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-ink-900 text-white text-[10px] font-bold flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.product.slug}`}
                className="text-xs font-medium text-ink-900 hover:text-blue-600 line-clamp-2"
              >
                {item.product.name}
              </Link>
              {item.variant.size || item.variant.color ? (
                <p className="text-[10px] text-ink-500 mt-0.5 truncate">
                  {[item.variant.size, item.variant.color]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-semibold text-ink-900">
                {formatKES(item.lineTotal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-cream-200 px-5 py-4 space-y-2.5 text-sm">
        <Row label="Subtotal" value={formatKES(subtotal)} />

        {shippingLoading ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">Shipping</span>
            <span className="inline-flex items-center gap-1 text-ink-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Calculating
            </span>
          </div>
        ) : shippingQuote ? (
          <Row
            label="Shipping"
            value={
              shippingQuote.totalFee === 0 ? (
                <span className="text-sage-600 font-semibold">Free</span>
              ) : (
                formatKES(shippingQuote.totalFee)
              )
            }
            sublabel={shippingQuote.zoneLabel}
          />
        ) : (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">Shipping</span>
            <span className="text-ink-400 text-xs">Set at address</span>
          </div>
        )}

        <div className="border-t border-cream-200 pt-3 mt-3">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold text-ink-900">Total</span>
            <span className="font-display text-2xl font-semibold text-ink-900">
              {formatKES(total)}
            </span>
          </div>
          <p className="text-[10px] text-ink-500 mt-1">
            VAT included where applicable
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-2">
        <Button
          size="lg"
          className="w-full"
          disabled={!canPlace || placing}
          onClick={onPlace}
        >
          {placing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Placing order…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              {actionLabel}
            </>
          )}
        </Button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-500">
          <Shield className="h-3 w-3 text-sage-500" />
          Secure · Your data is protected
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-ink-500">{label}</span>
        <span className="font-medium text-ink-900">{value}</span>
      </div>
      {sublabel && (
        <p className="text-[10px] text-ink-400 text-right">{sublabel}</p>
      )}
    </div>
  );
}
