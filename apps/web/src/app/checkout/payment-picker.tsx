"use client";

import { Smartphone, Banknote, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentProvider = "MPESA" | "COD";

interface Props {
  value: PaymentProvider;
  onChange: (v: PaymentProvider) => void;
  cashOnDeliveryEnabled?: boolean;
}

const OPTIONS: {
  id: PaymentProvider;
  label: string;
  description: string;
  icon: typeof Smartphone;
  badge?: string;
}[] = [
  {
    id: "MPESA",
    label: "M-Pesa",
    description: "Pay securely via Safaricom STK Push",
    icon: Smartphone,
    badge: "Recommended",
  },
  {
    id: "COD",
    label: "Cash on Delivery",
    description: "Pay the rider when your order arrives",
    icon: Banknote,
  },
];

export function PaymentPicker({ value, onChange, cashOnDeliveryEnabled }: Props) {
  const options = cashOnDeliveryEnabled === true ? OPTIONS : OPTIONS.filter((option) => option.id !== "COD");
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-cream-100 text-ink-700 text-xs">
          3
        </span>
        Payment method
      </h2>

      <div className="space-y-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = value === opt.id;
          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={cn(
                "w-full text-left rounded-xl border-2 p-3.5 transition-all",
                selected
                  ? "border-blue-400 bg-blue-50/50"
                  : "border-cream-200 bg-white hover:border-blue-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    selected
                      ? "bg-blue-500 text-white"
                      : "bg-cream-100 text-ink-600"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink-900">
                      {opt.label}
                    </span>
                    {opt.badge && (
                      <span className="inline-flex items-center rounded-md bg-sage-100 text-sage-700 text-[10px] font-semibold px-1.5 py-0.5">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {opt.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    selected
                      ? "border-blue-500 bg-blue-500"
                      : "border-ink-300"
                  )}
                >
                  {selected && <Check className="h-3 w-3 text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {cashOnDeliveryEnabled !== true && (
        <p className="mt-3 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-[11px] text-ink-500">
          {cashOnDeliveryEnabled === false ? "Pay on delivery is temporarily unavailable. Please use M-Pesa." : "Checking available payment methods…"}
        </p>
      )}

      {value === "MPESA" && (
        <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[11px] text-blue-800 flex items-start gap-2">
          <Smartphone className="h-3 w-3 mt-0.5 shrink-0" />
          <span>
            After placing the order, you'll receive a prompt on your phone.
            Enter your M-Pesa PIN to complete payment.
          </span>
        </div>
      )}
    </div>
  );
}
