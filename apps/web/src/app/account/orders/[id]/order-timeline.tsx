import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Home,
  XCircle,
  RotateCcw,
  Circle,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@baby-shop/shared";

interface StatusEvent {
  status: OrderStatus;
  note?: string;
  at: string;
  by?: string;
}

interface Props {
  currentStatus: OrderStatus;
  history: StatusEvent[];
  paymentProvider?: "MPESA" | "COD";
}

const STATUS_STEPS: {
  key: OrderStatus;
  label: string;
  description: string;
  icon: typeof Clock;
}[] = [
  {
    key: "PENDING",
    label: "Order placed",
    description: "We received your order",
    icon: Clock,
  },
  {
    key: "PAID",
    label: "Payment received",
    description: "Your payment has been confirmed",
    icon: CheckCircle2,
  },
  {
    key: "PROCESSING",
    label: "Preparing",
    description: "We're packing your items",
    icon: Package,
  },
  {
    key: "SHIPPED",
    label: "Shipped",
    description: "Your order is on the way",
    icon: Truck,
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    description: "Enjoy your order!",
    icon: Home,
  },
];

// Special end states that break the linear flow
const TERMINAL_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];

export function OrderTimeline({ currentStatus, history, paymentProvider }: Props) {
  // If order is cancelled or refunded, render a distinct branch
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    const terminalEvent = history.find((h) => h.status === currentStatus);
    const isCancelled = currentStatus === "CANCELLED";
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
              isCancelled
                ? "bg-ink-100 text-ink-600"
                : "bg-pink-100 text-pink-600"
            )}
          >
            {isCancelled ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-ink-900">
              {isCancelled ? "Order cancelled" : "Order refunded"}
            </p>
            {terminalEvent?.note && (
              <p className="text-xs text-ink-500 mt-0.5">
                {terminalEvent.note}
              </p>
            )}
            {terminalEvent?.at && (
              <p className="text-[11px] text-ink-400 mt-1">
                {formatDate(terminalEvent.at)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Which step index are we on?
  const steps = paymentProvider === "COD"
    ? STATUS_STEPS.filter((step) => step.key !== "PAID")
    : STATUS_STEPS;
  const currentIndex = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div>
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isComplete = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isPending = idx > currentIndex;

        // Find matching history entry (optional note)
        const event = history.find((h) => h.status === step.key);

        return (
          <div key={step.key} className="flex gap-3">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all",
                  isComplete &&
                    "bg-sage-100 text-sage-600 ring-2 ring-sage-200",
                  isCurrent &&
                    "bg-blue-500 text-white ring-4 ring-blue-100",
                  isPending && "bg-cream-100 text-ink-300"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <Icon className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {/* Connector */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 flex-1 my-1 min-h-[24px]",
                    isComplete ? "bg-sage-300" : "bg-cream-200"
                  )}
                />
              )}
            </div>

            {/* Text column */}
            <div className="flex-1 min-w-0 pb-5 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent
                        ? "text-ink-900"
                        : isComplete
                        ? "text-ink-700"
                        : "text-ink-400"
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-0.5",
                      isCurrent
                        ? "text-ink-600"
                        : isComplete
                        ? "text-ink-500"
                        : "text-ink-300"
                    )}
                  >
                    {event?.note ?? step.description}
                  </p>
                  {event?.at && (isComplete || isCurrent) && (
                    <p className="text-[11px] text-ink-400 mt-1">
                      {formatDate(event.at)}
                    </p>
                  )}
                </div>
                {isCurrent && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 shrink-0">
                    Current
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
