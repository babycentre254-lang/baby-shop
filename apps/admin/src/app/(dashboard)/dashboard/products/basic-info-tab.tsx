"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Lock,
  Unlock,
  ExternalLink,
  Tag,
  Award,
  Baby,
  Layers,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "./rich-text-editor";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface BasicInfoValue {
  name: string;
  slug: string;
  shortDesc: string;
  description: string;
  categoryId: string;
  brandId: string;
  ageRange: string;
  material: string;
  safetyCerts: string[];
  isFeatured: boolean;
  isPublished: boolean;
}

interface Props {
  value: BasicInfoValue;
  onChange: (patch: Partial<BasicInfoValue>) => void;
  categories: { _id: string; name: string }[];
  brands: { _id: string; name: string }[];
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const CERT_OPTIONS = [
  { id: "OEKO-TEX", label: "OEKO-TEX®", hint: "Textile safety" },
  { id: "CE", label: "CE", hint: "EU conformity" },
  { id: "ASTM", label: "ASTM", hint: "US toy safety" },
  { id: "CPSIA", label: "CPSIA", hint: "US consumer safety" },
  { id: "BPA-free", label: "BPA-free", hint: "No bisphenol-A" },
];

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function BasicInfoTab({ value, onChange, categories, brands }: Props) {
  const [slugLocked, setSlugLocked] = useState(true);

  // Auto-generate slug when name changes and slug is locked (or empty)
  useEffect(() => {
    if (slugLocked && value.name) {
      const next = slugify(value.name);
      if (next !== value.slug) {
        onChange({ slug: next });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.name, slugLocked]);

  function regenerateSlug() {
    onChange({ slug: slugify(value.name) });
  }

  const urlPreview = `babycentre.co.ke/products/${value.slug || "your-slug"}`;

  return (
    <div className="space-y-6">
      {/* ─── Identity ─── */}
      <Section title="Identity" subtitle="The name and URL of your product">
        <Field
          label="Product name"
          value={value.name}
          onChange={(v) => onChange({ name: v })}
          placeholder="e.g. Organic Cotton Onesie"
          required
          maxLength={200}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-ink-700">
              URL slug
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSlugLocked((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors",
                  slugLocked
                    ? "text-ink-500 hover:text-ink-800 hover:bg-cream-100"
                    : "text-blue-600 bg-blue-50"
                )}
                title={slugLocked ? "Unlock to edit manually" : "Locked to auto-generate"}
              >
                {slugLocked ? (
                  <>
                    <Lock className="h-3 w-3" />
                    Auto
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" />
                    Manual
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={regenerateSlug}
                className="h-6 w-6 rounded-md text-ink-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center transition-colors"
                title="Regenerate from name"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={value.slug}
              onChange={(e) => {
                setSlugLocked(false);
                onChange({ slug: slugify(e.target.value) });
              }}
              placeholder="organic-cotton-onesie"
              className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white pl-3.5 pr-10 text-sm font-mono focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
            {value.slug && (
              <a
                href={`http://localhost:3000/products/${value.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg text-ink-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center"
                title="Open on storefront"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <p className="text-xs text-ink-500 mt-1.5 flex items-center gap-1.5">
            <span className="text-ink-400">URL:</span>
            <code className="text-ink-600 font-mono text-[11px] truncate">
              {urlPreview}
            </code>
          </p>
        </div>

        <Field
          label="Short description"
          value={value.shortDesc}
          onChange={(v) => onChange({ shortDesc: v })}
          placeholder="One-line summary shown in listings and cards"
          maxLength={300}
          counter
        />
      </Section>

      {/* ─── Description (rich) ─── */}
      <Section
        title="Description"
        subtitle="Rich content — add formatting, images, and video"
        icon={<Sparkles className="h-4 w-4 text-pink-500" />}
      >
        <RichTextEditor
          value={value.description}
          onChange={(v) => onChange({ description: v })}
          placeholder="Describe your product — materials, features, care instructions…"
          minHeight={320}
          maxLength={5000}
        />
      </Section>

      {/* ─── Classification ─── */}
      <Section
        title="Classification"
        subtitle="Where this product lives in your catalog"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField
            label="Category"
            value={value.categoryId}
            onChange={(v) => onChange({ categoryId: v })}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
            placeholder="Select a category"
            required
            icon={<Layers className="h-3.5 w-3.5" />}
          />
          <SelectField
            label="Brand"
            value={value.brandId}
            onChange={(v) => onChange({ brandId: v })}
            options={brands.map((b) => ({ value: b._id, label: b.name }))}
            placeholder="No brand"
            icon={<Award className="h-3.5 w-3.5" />}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Age range"
            value={value.ageRange}
            onChange={(v) => onChange({ ageRange: v })}
            placeholder="e.g. 0-3M, 6-12M"
            maxLength={40}
            icon={<Baby className="h-3.5 w-3.5" />}
          />
          <Field
            label="Material"
            value={value.material}
            onChange={(v) => onChange({ material: v })}
            placeholder="e.g. 100% organic cotton"
            maxLength={200}
            icon={<Tag className="h-3.5 w-3.5" />}
          />
        </div>
      </Section>

      {/* ─── Certifications ─── */}
      <Section
        title="Safety certifications"
        subtitle="Highlight compliance for peace of mind"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CERT_OPTIONS.map(({ id, label, hint }) => {
            const active = value.safetyCerts.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() =>
                  onChange({
                    safetyCerts: active
                      ? value.safetyCerts.filter((c) => c !== id)
                      : [...value.safetyCerts, id],
                  })
                }
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all",
                  active
                    ? "border-blue-400 bg-blue-50"
                    : "border-cream-300 bg-white hover:border-blue-200"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                    active ? "bg-blue-500 border-blue-500" : "border-ink-300"
                  )}
                >
                  {active && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-900">{label}</p>
                  <p className="text-[11px] text-ink-500 mt-0.5">{hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ─── Visibility ─── */}
      <Section title="Visibility" subtitle="Control where and when this shows">
        <div className="grid sm:grid-cols-2 gap-4">
          <ToggleField
            label="Featured product"
            description="Show in the Featured section on the homepage"
            value={value.isFeatured}
            onChange={(v) => onChange({ isFeatured: v })}
          />
          <ToggleField
            label="Published"
            description="Visible to customers immediately"
            value={value.isPublished}
            onChange={(v) => onChange({ isPublished: v })}
          />
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Section wrapper
// ═══════════════════════════════════════════════════════════

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header className="flex items-start gap-3 pb-3 border-b border-cream-200">
        {icon && (
          <div className="h-8 w-8 rounded-lg bg-cream-100 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Form primitives
// ═══════════════════════════════════════════════════════════

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  maxLength,
  counter,
  icon,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  counter?: boolean;
  icon?: React.ReactNode;
  hint?: string;
}) {
  const len = value.length;
  const pct = maxLength ? len / maxLength : 0;
  const counterTone =
    pct >= 1
      ? "text-pink-600"
      : pct >= 0.85
      ? "text-yellow-600"
      : "text-ink-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm font-medium text-ink-700">
          {icon && <span className="text-ink-400">{icon}</span>}
          {label}
          {required && <span className="text-pink-500 ml-0.5">*</span>}
        </label>
        {counter && maxLength && (
          <span className={cn("text-[10px] font-medium", counterTone)}>
            {len}/{maxLength}
          </span>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
      />
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-ink-700">
        {icon && <span className="text-ink-400">{icon}</span>}
        {label}
        {required && <span className="text-pink-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
      >
        <option value="">{placeholder ?? "— Select —"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors w-full",
        value
          ? "border-blue-400 bg-blue-50"
          : "border-cream-300 bg-white hover:border-blue-200"
      )}
    >
      <div
        className={cn(
          "mt-0.5 relative h-5 w-9 rounded-full transition-colors shrink-0",
          value ? "bg-blue-500" : "bg-ink-200"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        {description && (
          <p className="text-xs text-ink-500 mt-0.5">{description}</p>
        )}
      </div>
    </button>
  );
}