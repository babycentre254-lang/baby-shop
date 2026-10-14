"use client";

import { useState, useEffect, useMemo } from "react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Shield,
  AlertTriangle,
  ShoppingBag,
  Lock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/hooks/use-cart";
import { useSession } from "@/lib/hooks/use-session";
import { useShippingQuote } from "@/lib/hooks/use-shipping-quote";
import { addressesApi, checkoutApi } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { AddressPicker } from "./address-picker";
import { ShippingCard } from "./shipping-card";
import { PaymentPicker } from "./payment-picker";
import { OrderSummary } from "./order-summary";
import type { Address } from "@baby-shop/shared";

type PaymentProvider = "MPESA" | "COD";

export function CheckoutClient() {
  const router = useRouter();
  const { user, isLoading: sessionLoading } = useSession();
  const { cart, isLoading: cartLoading, isAuthenticated, refetch: refetchCart } =
    useCart();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider>("MPESA");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  // ─── Fetch addresses ───
  const addressesQ = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressesApi.list(),
    enabled: isAuthenticated,
  });

  const checkoutOptionsQ = useQuery({
    queryKey: ["checkout-options"],
    queryFn: () => checkoutApi.options(),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
  const cashOnDeliveryEnabled = checkoutOptionsQ.data?.cashOnDeliveryEnabled ?? false;

  useEffect(() => {
    if (checkoutOptionsQ.isSuccess && !cashOnDeliveryEnabled && paymentProvider === "COD") setPaymentProvider("MPESA");
  }, [checkoutOptionsQ.isSuccess, cashOnDeliveryEnabled, paymentProvider]);

  const addresses: Address[] = addressesQ.data?.items ?? [];

  // Auto-select default address
  useEffect(() => {
    if (selectedAddressId || addresses.length === 0) return;
    const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
    setSelectedAddressId(defaultAddr._id);
  }, [addresses, selectedAddressId]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a._id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  // ─── Shipping quote ───
  const weightGrams = cart?.totalWeightGrams ?? 0;

  const quoteQ = useShippingQuote(
    selectedAddress?.county ?? null,
    weightGrams,
    isAuthenticated && !!selectedAddress
  );

  const quote = quoteQ.data ?? null;
  const canPlaceOrder = !!selectedAddressId && !!quote && !quoteQ.isFetching && !quoteQ.isError && !(paymentProvider === "COD" && !cashOnDeliveryEnabled);

  // ─── Redirect unauth ───
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push("/login?next=/checkout");
    }
  }, [sessionLoading, isAuthenticated, router]);

  // ─── Empty cart ───
  if (!cartLoading && isAuthenticated && cart && cart.items.length === 0) {
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
            Add some items before checking out.
          </p>
          <Button size="lg" asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ─── Loading state ───
  if (cartLoading || sessionLoading || !cart) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center gap-2 text-ink-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Preparing checkout…
        </div>
      </div>
    );
  }

  // ─── Place order ───
  async function handlePlaceOrder() {
    if (submittingRef.current) return;
    setError(null);

    if (!selectedAddressId) {
      setError("Please select a delivery address");
      return;
    }

    if (!quote) {
      setError("Shipping fee is still being calculated. Please wait.");
      return;
    }

    if (paymentProvider === "COD" && !cashOnDeliveryEnabled) {
      setError("Pay on delivery is temporarily unavailable. Please choose M-Pesa.");
      return;
    }

    submittingRef.current = true;
    setPlacing(true);
    try {
        const res = await checkoutApi.placeOrder({
        addressId: selectedAddressId,
        paymentProvider,
        notes: notes.trim() || undefined,
        expectedShippingFee: quote.totalFee,
        });

        await refetchCart();

        if (paymentProvider === "MPESA") {
        // Payment sessions are not orders until M-Pesa confirms them.
        router.push(`/checkout/pay/${res.session._id}`);
        } else {
        // COD — order is confirmed, go straight to success
        if (!res.order) throw new Error("Your order could not be confirmed. Please try again.");
        router.push(`/checkout/success?orderId=${res.order._id}`);
        }
    } catch (err: any) {
      if (err?.code === "SHIPPING_FEE_MISMATCH") {
        await quoteQ.refetch();
        setError("The delivery rate changed. Your total has been refreshed; review it and place the order again.");
      } else {
        setError(err?.message ?? "Could not place order. Please try again.");
      }
      setPlacing(false);
      submittingRef.current = false;
    }
  }

  const subtotal = cart.subtotal;
  const shippingFee = quote?.totalFee ?? null;
  const total = shippingFee !== null ? subtotal + shippingFee : subtotal;

  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-ink-400 mb-4">
          <Link href="/" className="hover:text-blue-500">
            Home
          </Link>
          <span className="text-ink-300">/</span>
          <Link href="/cart" className="hover:text-blue-500">
            Cart
          </Link>
          <span className="text-ink-300">/</span>
          <span className="text-ink-800">Checkout</span>
        </nav>

        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-ink-900">
              Checkout
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Complete your order — takes less than a minute
            </p>
          </div>
          <Link
            href="/cart"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cart
          </Link>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 flex items-start gap-2 text-sm text-pink-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Grid */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left column — steps */}
          <div className="space-y-5 min-w-0">
            {/* Step 1: Address */}
            <AddressPicker
              addresses={addresses}
              isLoading={addressesQ.isLoading}
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
              onAddressAdded={(newId) => {
                addressesQ.refetch();
                setSelectedAddressId(newId);
              }}
            />

            {/* Step 2: Shipping */}
            <ShippingCard
              quote={quote}
              isLoading={quoteQ.isFetching}
              error={quoteQ.error}
              hasAddress={!!selectedAddress}
              onRetry={() => quoteQ.refetch()}
            />

            {/* Step 3: Payment */}
            <PaymentPicker
              value={paymentProvider}
              onChange={setPaymentProvider}
              cashOnDeliveryEnabled={checkoutOptionsQ.isLoading ? undefined : cashOnDeliveryEnabled}
            />

            {/* Step 4: Notes */}
            <div className="rounded-2xl border border-cream-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-cream-100 text-ink-700 mr-2 text-xs">
                  4
                </span>
                Order notes (optional)
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything we should know? Gate code, landmark, delivery preferences…"
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border-2 border-ink-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-y"
              />
              <p className="text-[10px] text-ink-400 mt-1 text-right">
                {notes.length}/500
              </p>
            </div>

            {/* Place order button (mobile) */}
            <div className="lg:hidden">
              <PlaceOrderButton
                disabled={!canPlaceOrder || placing}
                placing={placing}
                label={paymentProvider === "MPESA" ? "Continue to payment" : "Place COD order"}
                onPlace={handlePlaceOrder}
              />
            </div>
          </div>

          {/* Right column — summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummary
              items={cart.items}
              subtotal={subtotal}
              shippingQuote={quote}
              shippingLoading={quoteQ.isFetching}
              total={total}
              placing={placing}
              canPlace={canPlaceOrder}
              actionLabel={paymentProvider === "MPESA" ? "Continue to payment" : "Place COD order"}
              onPlace={handlePlaceOrder}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Shared button
// ═══════════════════════════════════════════════════════════

function PlaceOrderButton({
  disabled,
  placing,
  label,
  onPlace,
}: {
  disabled: boolean;
  placing: boolean;
  label: string;
  onPlace: () => void;
}) {
  return (
    <Button
      size="lg"
      className="w-full"
      disabled={disabled}
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
          {label}
        </>
      )}
    </Button>
  );
}
