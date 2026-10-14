import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { ordersServerApi } from "@/lib/api/endpoints.server";
import { Button } from "@/components/ui/button";
import { formatKES, formatDate } from "@/lib/utils";
import type { Order } from "@baby-shop/shared";

export const metadata = { title: "Order confirmed" };

interface Props {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams;
  let order: Order | null = null;
  if (orderId) {
    try {
      order = (await ordersServerApi.getMine(orderId)).order;
    } catch {
      order = null;
    }
  }

  const paid = Boolean(order && (
    (order as any).payment?.status === "SUCCESS" ||
    (order.paymentProvider === "MPESA" && ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status))
  ));

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eef5ed,_#faf8f3_52%)] px-4 py-10 sm:px-6 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-7 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
          <ShoppingBag className="h-4 w-4" /> BabyCentre · Checkout
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-cream-200 bg-white shadow-[0_24px_80px_-36px_rgba(30,45,36,0.25)]">
          <div className="relative overflow-hidden bg-ink-900 px-6 py-9 text-white sm:px-10 sm:py-12">
            <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full border-[36px] border-white/5" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sage-400 text-ink-900 shadow-lg shadow-black/10">
                {paid ? <CheckCircle2 className="h-8 w-8" /> : <PackageCheck className="h-8 w-8" />}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sage-200">
                  {paid ? "Payment confirmed" : "Order received"}
                </p>
                <h1 className="font-display text-3xl leading-tight sm:text-4xl">
                  {paid ? "You’re all set." : "We’re getting your order ready."}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                  {paid
                    ? "Your M-Pesa payment was confirmed. We’ll keep you updated as your order is prepared and delivered."
                    : "Your cash-on-delivery order is confirmed. Pay the courier when your items arrive."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_280px]">
            <section>
              {order ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-cream-200 pb-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-ink-400">Order reference</p>
                      <p className="mt-1 font-mono text-lg font-bold text-ink-900">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-ink-500">Placed {formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${paid ? "bg-sage-100 text-sage-700" : "bg-blue-50 text-blue-700"}`}>
                      {paid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                      {paid ? "Paid" : "Pay on delivery"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-cream-100 p-2 text-ink-500"><MapPin className="h-4 w-4" /></div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Delivering to</p>
                        <p className="mt-1 text-sm font-semibold text-ink-900">{order.shippingAddress.fullName}</p>
                        <p className="text-sm text-ink-600">{order.shippingAddress.town}, {order.shippingAddress.county}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-cream-100 p-2 text-ink-500"><PackageCheck className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">In your order</p>
                        <div className="mt-2 space-y-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={`${item.variantId}-${index}`} className="flex justify-between gap-4 text-sm">
                              <span className="min-w-0 truncate text-ink-700">{item.productName} <span className="text-ink-400">× {item.quantity}</span></span>
                              <span className="shrink-0 font-medium text-ink-800">{formatKES(item.lineTotal)}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && <p className="text-xs text-ink-500">and {order.items.length - 3} more item{order.items.length - 3 === 1 ? "" : "s"}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 border-t border-cream-200 pt-5 sm:flex-row">
                    <Button asChild className="sm:min-w-48">
                      <Link href={`/account/orders/${order._id}`}>Track your order <ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="outline" asChild><Link href="/products">Continue shopping</Link></Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-display text-2xl text-ink-900">Order confirmed</h2>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-ink-600">Your order was placed successfully. You can find its status and delivery details in your account.</p>
                  <Button asChild className="mt-6"><Link href="/account/orders">View my orders <ArrowRight className="h-4 w-4" /></Link></Button>
                </>
              )}
            </section>

            <aside className="h-fit rounded-2xl bg-cream-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Order total</p>
              {order ? <p className="mt-1 font-display text-3xl font-semibold text-ink-900">{formatKES(order.total)}</p> : <p className="mt-1 text-sm text-ink-500">See your account for the total.</p>}
              <p className="mt-1 text-xs text-ink-500">{paid ? "Payment received via M-Pesa" : "Amount due when delivered"}</p>
              <div className="my-5 border-t border-cream-200" />
              <div className="flex items-start gap-2 text-xs leading-5 text-ink-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                Your order and payment updates are available anytime in My Orders.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
