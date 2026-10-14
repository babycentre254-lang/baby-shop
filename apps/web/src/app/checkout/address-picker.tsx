"use client";

import { useState } from "react";
import { MapPin, Plus, Loader2, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { addressesApi } from "@/lib/api/endpoints";
import type { Address } from "@baby-shop/shared";

interface Props {
  addresses: Address[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddressAdded: (newId: string) => void;
}

export function AddressPicker({
  addresses,
  isLoading,
  selectedId,
  onSelect,
  onAddressAdded,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-cream-100 text-ink-700 text-xs">
            1
          </span>
          Delivery address
        </h2>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs font-medium text-blue-500 hover:text-blue-600 inline-flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            New address
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading addresses…
        </div>
      ) : showAdd ? (
        <AddAddressForm
          onCancel={() => setShowAdd(false)}
          onSuccess={(id) => {
            setShowAdd(false);
            onAddressAdded(id);
          }}
        />
      ) : addresses.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-cream-300 bg-cream-50 p-6 text-center">
          <MapPin className="h-8 w-8 text-ink-400 mx-auto mb-2" />
          <p className="text-sm text-ink-600 mb-3">No addresses yet</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600"
          >
            <Plus className="h-4 w-4" />
            Add your first address
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map((addr) => {
            const selected = addr._id === selectedId;
            return (
              <button
                key={addr._id}
                onClick={() => onSelect(addr._id)}
                className={cn(
                  "w-full text-left rounded-xl border-2 p-3.5 transition-all",
                  selected
                    ? "border-blue-400 bg-blue-50/50"
                    : "border-cream-200 bg-white hover:border-blue-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      selected
                        ? "border-blue-500 bg-blue-500"
                        : "border-ink-300"
                    )}
                  >
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink-900">
                        {addr.fullName}
                      </span>
                      {addr.label && (
                        <span className="inline-flex items-center rounded-md bg-cream-100 text-ink-600 text-[10px] font-medium px-1.5 py-0.5">
                          {addr.label}
                        </span>
                      )}
                      {addr.isDefault && (
                        <span className="inline-flex items-center rounded-md bg-blue-100 text-blue-700 text-[10px] font-medium px-1.5 py-0.5">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-500 mt-1">
                      {addr.phone}
                    </p>
                    <p className="text-xs text-ink-600 mt-1.5">
                      {addr.street}, {addr.town}, {addr.county}
                    </p>
                    {addr.notes && (
                      <p className="text-[11px] text-ink-400 mt-1 italic">
                        {addr.notes}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Add address form
// ═══════════════════════════════════════════════════════════

import { KENYAN_COUNTIES } from "@baby-shop/shared";

function AddAddressForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    county: "Nairobi",
    town: "",
    street: "",
    notes: "",
    isDefault: false,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await addressesApi.create({
        label: form.label || "Home",
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        county: form.county,
        town: form.town.trim(),
        street: form.street.trim(),
        notes: form.notes.trim() || undefined,
        isDefault: form.isDefault,
      });
      onSuccess(res.address._id);
    } catch (err: any) {
      setError(err?.message ?? "Could not save address");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <div className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-xs text-pink-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Full name"
          value={form.fullName}
          onChange={(v) => setForm({ ...form, fullName: v })}
          placeholder="Jane Wanjiru"
          required
        />
        <Field
          label="Phone"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder="0712 345 678"
          required
        />
      </div>

      <div>
        <label className="text-xs font-medium text-ink-600 block mb-1">
          County
        </label>
        <div className="relative">
          <select
            value={form.county}
            onChange={(e) => setForm({ ...form, county: e.target.value })}
            className="w-full h-10 rounded-lg border-2 border-ink-200 bg-white pl-3 pr-9 text-sm appearance-none focus:border-blue-400 focus:outline-none"
          >
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Town / Area"
          value={form.town}
          onChange={(v) => setForm({ ...form, town: v })}
          placeholder="Westlands"
          required
        />
        <Field
          label="Label"
          value={form.label}
          onChange={(v) => setForm({ ...form, label: v })}
          placeholder="Home"
        />
      </div>

      <Field
        label="Street / Building"
        value={form.street}
        onChange={(v) => setForm({ ...form, street: v })}
        placeholder="Waiyaki Way, Apt 4B"
        required
      />

      <Field
        label="Delivery notes (optional)"
        value={form.notes}
        onChange={(v) => setForm({ ...form, notes: v })}
        placeholder="Gate code, landmarks…"
      />

      <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          className="h-4 w-4 rounded border-ink-300 text-blue-500"
        />
        Set as default address
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 rounded-lg border-2 border-ink-200 text-sm text-ink-600 hover:bg-cream-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Saving…" : "Save and use"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-600 block mb-1">
        {label}
        {required && <span className="text-pink-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-10 rounded-lg border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}