"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Smartphone,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Shield,
  RefreshCw,
  Phone,
  Receipt,
  HelpCircle,
  XCircle,
  Info,
} from "lucide-react";
import { paymentsApi } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { cn, formatKES } from "@/lib/utils";

interface Props {
  sessionId: string;
}

type Stage =
  | "enter-phone"
  | "awaiting-pin"
  | "verifying"
  | "failed"
  | "cancelled";

export function PaymentClient({ sessionId }: Props) {
  const router = useRouter();
  const qc = useQueryClient();

  // ─── Local state ───
  const [stage, setStage] = useState<Stage>("enter-phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [failureLabel, setFailureLabel] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(true);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  // ─── Poll payment status every 3s while awaiting ───
  const statusQ = useQuery({
    queryKey: ["checkout-session-payment", sessionId],
    queryFn: () => paymentsApi.getCheckoutSessionStatus(sessionId),
    // Always fetch on mount; polling only kicks in while awaiting PIN
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (data.session.status === "COMPLETED") return false;
      if (data.session.status === "EXPIRED" || data.session.status === "CANCELLED") return false;
      if (data.payment?.status === "FAILED") return false;
      return stage === "awaiting-pin" ? 3000 : false;
    },
    retry: false,
  });

  const statusData = statusQ.data;

  // ─── Prefill phone ───
  useEffect(() => {
    if (!phone && statusData?.payment?.phone) {
      setPhone(statusData.payment.phone);
    }
  }, [statusData, phone]);

  // ─── React to state changes ───
  useEffect(() => {
    if (!statusData) return;
    const { session, order, payment } = statusData;

    if (payment?.status === "PENDING" && stage === "enter-phone") {
      setStage("awaiting-pin");
    }

    // Success path
    if (session.status === "COMPLETED" && order) {
      setStage("verifying");
      if (payment?.mpesaReceiptNumber) {
        setReceiptNumber(payment.mpesaReceiptNumber);
      }
      const t = setTimeout(() => {
        router.push(`/checkout/success?orderId=${order._id}`);
      }, 1500);
      return () => clearTimeout(t);
    }

    // Order cancelled
    if (session.status === "EXPIRED" || session.status === "CANCELLED") {
      setStage("cancelled");
      setFailureMessage("This checkout has expired. Your cart is still available; return to checkout to start again.");
      return;
    }

    // Payment failed
    if (payment?.status === "FAILED" && stage === "awaiting-pin") {
      setStage("failed");
      setFailureMessage(
        payment.userMessage ??
          "The payment could not be completed. Please try again."
      );
      setFailureLabel(payment.resultLabel ?? null);
      setCanRetry(payment.retryable ?? true);
    }
  }, [statusData, stage, router]);

  // ─── Timeout after 90 seconds of waiting ───
  useEffect(() => {
    if (stage !== "awaiting-pin") return;
    if (pollCount > 30) {
      // 30 × 3s = 90s
      setStage("failed");
      setFailureMessage(
        "We didn't receive a response from your phone. Please make sure your phone is on, has network, and try again."
      );
      setFailureLabel("NO_RESPONSE_FROM_USER");
      setCanRetry(true);
    }
  }, [stage, pollCount]);

  // Count polls
  useEffect(() => {
    if (statusQ.dataUpdatedAt) {
      setPollCount((c) => c + 1);
    }
  }, [statusQ.dataUpdatedAt]);

  // ─── Initiate payment ───
  async function handlePay() {
    setError(null);
    setFailureMessage(null);

    const cleaned = phone.replace(/[^\d]/g, "");
    let normalized = cleaned;
    if (cleaned.startsWith("0")) normalized = `254${cleaned.slice(1)}`;
    if (cleaned.startsWith("7") || cleaned.startsWith("1"))
      normalized = `254${cleaned}`;

    if (!/^254[17]\d{8}$/.test(normalized)) {
      setError(
        "Please enter a valid Safaricom number (e.g. 0712345678 or 254712345678)"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await paymentsApi.initiateMpesa(statusData?.session.legacy
        ? { orderId: sessionId, phone: normalized }
        : { sessionId, phone: normalized });
      setCheckoutId(res.payment.checkoutRequestId);
      setPollCount(0);
      setStage("awaiting-pin");
    } catch (err: any) {
      setError(
        err?.message ??
          "Could not send the M-Pesa prompt. Please try again in a moment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function retryPayment() {
    setStage("enter-phone");
    setFailureMessage(null);
    setFailureLabel(null);
    setError(null);
    setCheckoutId(null);
    setPollCount(0);
  }

  // ─── Initial loading ───
   // ─── Loading (still fetching first time) ───
  if (statusQ.isLoading && !statusData) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-400 mx-auto" />
        <p className="text-xs text-ink-500 mt-3">Loading checkout…</p>
      </div>
    );
  }

  // ─── Genuinely not found (query finished + error) ───
  if (statusQ.isFetched && !statusData) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl border-2 border-pink-200 bg-pink-50 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-pink-600 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-ink-900 mb-2">
            We couldn't find that order
          </h1>
          <p className="text-sm text-ink-600 mb-6">
            It may have expired or belong to a different account.
          </p>
          <Button asChild>
            <Link href="/products">Back to shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ─── Safety net ───
  if (!statusData) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-400 mx-auto" />
      </div>
    );
  }

  if (statusQ.isError || !statusData) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl border-2 border-pink-200 bg-pink-50 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-pink-600 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-ink-900 mb-2">
            We couldn't find that order
          </h1>
          <p className="text-sm text-ink-600 mb-6">
            It may have expired or belong to a different account.
          </p>
          <Button asChild>
            <Link href="/products">Back to shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { session } = statusData;

  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-ink-400 mb-5">
          <Link href="/cart" className="hover:text-blue-500">
            Cart
          </Link>
          <span className="text-ink-300">/</span>
          <Link href="/checkout" className="hover:text-blue-500">
            Checkout
          </Link>
          <span className="text-ink-300">/</span>
          <span className="text-ink-800">Payment</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white mb-4 shadow-lg shadow-green-100">
            <Smartphone className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl text-ink-900 mb-1">
            Complete your payment
          </h1>
          <p className="text-sm text-ink-500">
            Checkout reference{" "}
            <span className="font-mono font-semibold text-ink-800">
              {sessionId.slice(-8).toUpperCase()}
            </span>{" "}
            · {formatKES(session.total)}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 flex items-start gap-2 text-sm text-pink-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* ═══ Stage: enter phone ═══ */}
        {stage === "enter-phone" && (
          <div className="rounded-3xl border border-cream-200 bg-white p-6 md:p-8">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-ink-700 mb-1.5"
                >
                  M-Pesa phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    autoComplete="tel"
                    autoFocus
                    className="w-full h-12 rounded-xl border-2 border-ink-200 bg-white pl-11 pr-4 text-base focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-100"
                  />
                </div>
                <p className="text-xs text-ink-500 mt-2">
                  Enter the Safaricom number where you want to receive the
                  payment prompt.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={submitting || !phone.trim()}
                onClick={handlePay}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending prompt…
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    Pay {formatKES(session.total)} via M-Pesa
                  </>
                )}
              </Button>

              <div className="pt-2 border-t border-cream-200 space-y-2">
                <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-2">
                  How it works
                </p>
                <Step n="1" text="We'll send an STK Push to your phone" />
                <Step n="2" text="Enter your M-Pesa PIN on the prompt" />
                <Step n="3" text="Your order is confirmed automatically" />
              </div>

              <div className="pt-3 border-t border-cream-200 flex items-start gap-2 text-[11px] text-ink-500">
                <Shield className="h-3 w-3 mt-0.5 text-sage-500 shrink-0" />
                <span>
                  Payments are processed securely by Safaricom. BabyCentre
                  never sees your PIN.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Stage: awaiting PIN ═══ */}
        {stage === "awaiting-pin" && (
          <div className="rounded-3xl border border-cream-200 bg-white p-6 md:p-8 text-center">
            <div className="relative inline-flex mb-5">
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
              <div className="relative h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <Smartphone className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <h2 className="font-display text-2xl text-ink-900 mb-2">
              Check your phone
            </h2>
            <p className="text-sm text-ink-600 mb-6 max-w-md mx-auto">
              We sent an M-Pesa prompt to{" "}
              <strong className="text-ink-900">{phone}</strong>. Enter your
              PIN to complete the payment.
            </p>

            <div className="rounded-xl bg-cream-50 border border-cream-200 p-4 space-y-2 text-left max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-500">Amount</span>
                <span className="font-semibold text-ink-900">
                  {formatKES(session.total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-500">Phone</span>
                <span className="font-mono font-medium text-ink-800">
                  {phone}
                </span>
              </div>
              {checkoutId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-500">Reference</span>
                  <span className="font-mono text-[10px] text-ink-600 truncate max-w-[180px]">
                    {checkoutId}
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-6 max-w-xs mx-auto">
              <div className="h-1.5 rounded-full bg-cream-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (pollCount / 30) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 text-sm text-ink-500">
              <Loader2 className="h-4 w-4 animate-spin text-green-500" />
              Waiting for confirmation…
            </div>

            <p className="text-[11px] text-ink-400 mt-6 max-w-sm mx-auto">
              If you don't receive the prompt within a minute, check your phone
              signal, then click below to try again.
            </p>

            <button
              onClick={retryPayment}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-600"
            >
              <RefreshCw className="h-3 w-3" />
              Send prompt again
            </button>
          </div>
        )}

        {/* ═══ Stage: verifying ═══ */}
        {stage === "verifying" && (
          <div className="rounded-3xl border border-cream-200 bg-white p-10 text-center">
            <div className="h-16 w-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-9 w-9 text-sage-600" />
            </div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">
              Payment received!
            </h2>
            <p className="text-sm text-ink-500 mb-4">
              Finalizing your order…
            </p>
            {receiptNumber && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-cream-50 border border-cream-200 px-3 py-2 text-xs">
                <Receipt className="h-3.5 w-3.5 text-ink-500" />
                <span className="text-ink-500">M-Pesa receipt:</span>
                <span className="font-mono font-semibold text-ink-800">
                  {receiptNumber}
                </span>
              </div>
            )}
            <div className="mt-6">
              <Loader2 className="h-5 w-5 animate-spin text-sage-500 mx-auto" />
            </div>
          </div>
        )}

        {/* ═══ Stage: failed ═══ */}
        {stage === "failed" && (
          <div className="rounded-3xl border border-cream-200 bg-white p-6 md:p-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-9 w-9 text-pink-600" />
              </div>
              <h2 className="font-display text-2xl text-ink-900 mb-2">
                Payment could not be completed
              </h2>
              {failureLabel && (
                <span className="inline-flex items-center rounded-md bg-cream-100 text-ink-600 text-[10px] font-mono px-2 py-0.5 mb-4">
                  {failureLabel}
                </span>
              )}
              <p className="text-sm text-ink-600 max-w-md mx-auto mb-6">
                {failureMessage ?? "Something went wrong. Please try again."}
              </p>
            </div>

            {/* Helpful tips */}
            <div className="rounded-xl bg-cream-50 border border-cream-200 p-4 space-y-2 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-3.5 w-3.5 text-ink-500" />
                <span className="text-[11px] font-semibold text-ink-600 uppercase tracking-wider">
                  What to check
                </span>
              </div>
              <Tip text="Make sure your Safaricom line has enough balance" />
              <Tip text="Ensure your phone has network signal" />
              <Tip text="Enter your M-Pesa PIN correctly on the prompt" />
              <Tip text="Don't close the prompt until it confirms" />
            </div>

            {canRetry ? (
              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={retryPayment}
              >
                <RefreshCw className="h-4 w-4" />
                Try payment again
              </Button>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
                <Info className="h-4 w-4 mx-auto mb-2" />
                <p className="font-medium mb-1">This needs a different approach</p>
                <p className="text-xs">
                  Please contact support at{" "}
                  <span className="font-semibold">support@babycentre.co.ke</span>{" "}
                  or call <span className="font-semibold">+254 700 000 000</span>.
                </p>
              </div>
            )}

            <div className="mt-4 text-center">
              <Link
                href="/products"
                className="text-xs text-ink-500 hover:text-blue-500"
              >
                Or continue shopping
              </Link>
            </div>
          </div>
        )}

        {/* ═══ Stage: cancelled ═══ */}
        {stage === "cancelled" && (
          <div className="rounded-3xl border border-cream-200 bg-white p-10 text-center">
            <div className="h-16 w-16 rounded-full bg-ink-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-9 w-9 text-ink-500" />
            </div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">
              Checkout expired
            </h2>
            <p className="text-sm text-ink-500 mb-6">
              {failureMessage}
            </p>
            <Button asChild>
              <Link href="/checkout">Return to checkout</Link>
            </Button>
          </div>
        )}

        {/* Footer */}
        {stage === "enter-phone" && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-500">
            <ArrowLeft className="h-3 w-3" />
            <Link href="/checkout" className="hover:text-blue-500">
              Back to checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5 text-xs text-ink-600">
      <span className="h-5 w-5 rounded-full bg-cream-100 text-ink-700 flex items-center justify-center text-[10px] font-bold shrink-0">
        {n}
      </span>
      <span className="pt-0.5">{text}</span>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-xs text-ink-600">
      <span className="h-1 w-1 rounded-full bg-ink-400 mt-2 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
