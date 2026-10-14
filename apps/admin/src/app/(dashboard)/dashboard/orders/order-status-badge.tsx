import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Home,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@baby-shop/shared";

interface Props {
  status: OrderStatus;
  size?: "sm" | "md";
}

const CONFIG: Record<
  OrderStatus,
  {
    label: string;
    icon: typeof Clock;
    bg: string;
    text: string;
    dot: string;
  }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-800",
    dot: "bg-yellow-500",
  },
  PAID: {
    label: "Paid",
    icon: CheckCircle2,
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  PROCESSING: {
    label: "Processing",
    icon: Package,
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  SHIPPED: {
    label: "Shipped",
    icon: Truck,
    bg: "bg-sage-50 border-sage-200",
    text: "text-sage-800",
    dot: "bg-sage-500",
  },
  DELIVERED: {
    label: "Delivered",
    icon: Home,
    bg: "bg-sage-50 border-sage-200",
    text: "text-sage-800",
    dot: "bg-sage-500",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    bg: "bg-ink-100 border-ink-200",
    text: "text-ink-700",
    dot: "bg-ink-400",
  },
  REFUNDED: {
    label: "Refunded",
    icon: RotateCcw,
    bg: "bg-pink-50 border-pink-200",
    text: "text-pink-800",
    dot: "bg-pink-500",
  },
};

export function OrderStatusBadge({ status, size = "sm" }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        cfg.bg,
        cfg.text,
        size === "sm" ? "text-[11px] px-2.5 py-0.5" : "text-xs px-3 py-1"
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {cfg.label}
    </span>
  );
}