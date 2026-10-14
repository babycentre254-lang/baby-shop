"use client";

import { Truck, Loader2, AlertTriangle, Clock, Info } from "lucide-react";
import { formatKES } from "@/lib/utils";
import type { ShippingQuote } from "@baby-shop/shared";

interface Props {
  quote: ShippingQuote | null;
  isLoading: boolean;
  error: unknown;
  hasAddress: boolean;
  onRetry: () => void;
}

export function ShippingCard({ quote, isLoading, error, hasAddress, onRetry }: Props) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-cream-100 text-ink-700 text-xs">
          2
        </span>
        Delivery method
      </h2>

      {!hasAddress ? (
        <div className="rounded-xl border border-cream-200 bg-cream-50 p-4 flex items-start gap-2 text-sm text-ink-500">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Select a delivery address to see shipping options.</span>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Calculating shipping…
        </div>
      ) : error || !quote ? (
        <div className="rounded-xl border border-pink-200 bg-pink-50 p-4 flex items-start gap-2 text-sm text-pink-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="flex-1">Could not calculate shipping. Please try again.</span>
          <button type="button" onClick={onRetry} className="shrink-0 font-semibold underline underline-offset-2">Retry</button>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-sage-200 bg-sage-50/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-sage-100 text-sage-600 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">
                  {quote.zoneLabel}
                </p>
                {quote.etaText && (
                  <p className="text-xs text-ink-500 mt-0.5 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {quote.etaText}
                  </p>
                )}
                <p className="text-xs text-ink-500 mt-1">
                  {(quote.totalWeightGrams / 1000).toFixed(2)} kg · Base{" "}
                  {formatKES(quote.baseFee)}
                  {quote.additionalFee > 0 && (
                    <>
                      {" + "}
                      {formatKES(quote.additionalFee)} for {quote.additionalKg} kg over
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-semibold text-ink-900">
                {quote.totalFee === 0 ? "Free" : formatKES(quote.totalFee)}
              </span>
            </div>
          </div>

          {quote.isFallback && (
            <div className="mt-3 pt-3 border-t border-sage-200 flex items-start gap-2 text-[11px] text-amber-800">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>
                This county isn't in our standard zones — you're seeing the
                default rate. We'll confirm delivery timing via phone.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
