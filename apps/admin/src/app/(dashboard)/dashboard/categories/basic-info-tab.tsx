"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Lock,
  Unlock,
  ExternalLink,
  FolderTree,
  Hash,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImagePicker } from "./image-picker";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface CategoryBasicValue {
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  icon: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
}

interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

interface Props {
  value: CategoryBasicValue;
  onChange: (patch: Partial<CategoryBasicValue>) => void;
  categories: CategoryOption[]; // for parent dropdown
  /** Current category id — excluded from parent options */
  currentId?: string;
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
    .slice(0, 60);
}

const EMOJI_SUGGESTIONS = [
  "👶", "🧸", "🍼", "🛁", "👕", "🧦", "👟", "🎁", "🚼", "🛏️",
  "🧷", "🎨", "📚", "🎵", "🚗", "🧴", "🌡️", "🩺", "🥣", "🍽️",
];

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function BasicInfoTab({
  value,
  onChange,
  categories,
  currentId,
}: Props) {
  const [slugLocked, setSlugLocked] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Auto-slug
  useEffect(() => {
    if (slugLocked && value.name) {
      const next = slugify(value.name);
      if (next !== value.slug) onChange({ slug: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.name, slugLocked]);

  // Build a tree of ancestors for display
  const parentOptions = buildParentOptions(categories, currentId);

  const urlPreview = `babycentre.co.ke/categories/${value.slug || "your-slug"}`;

  return (
    <div className="space-y-6">
      {/* ─── Visual identity ─── */}
      <Section
        title="Visual identity"
        subtitle="How this category appears on the storefront"
        icon={<Sparkles className="h-4 w-4 text-pink-500" />}
      >
        <div className="grid md:grid-cols-2 gap-5">
          {/* Image */}
          <ImagePicker
            label="Category image"
            hint="Used on the category landing page and in some listings"
            value={value.imageUrl}
            onChange={(url) => onChange({ imageUrl: url })}
            aspect="square"
            fallbackEmoji="🖼️"
          />

          {/* Icon */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-700">
              Icon / emoji
            </label>
            <p className="text-xs text-ink-500">
              Shown in navigation menus and category tiles
            </p>

            <div className="flex items-center gap-2">
              <div className="h-16 w-16 rounded-2xl border-2 border-cream-300 bg-cream-50 flex items-center justify-center text-3xl shrink-0">
                {value.icon || "🎁"}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={value.icon}
                  onChange={(e) => onChange({ icon: e.target.value.slice(0, 4) })}
                  placeholder="Paste emoji or leave empty"
                  className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none"
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                >
                  {showEmojiPicker ? "Hide suggestions" : "Browse suggestions"}
                </button>
              </div>
            </div>

            {showEmojiPicker && (
              <div className="grid grid-cols-10 gap-1 rounded-xl border-2 border-cream-300 bg-cream-50 p-2">
                {EMOJI_SUGGESTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onChange({ icon: emoji });
                      setShowEmojiPicker(false);
                    }}
                    className="h-8 rounded-lg hover:bg-white flex items-center justify-center text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ─── Basic info ─── */}
      <Section
        title="Basic information"
        subtitle="Name, URL, and description"
      >
        <Field
          label="Category name"
          value={value.name}
          onChange={(v) => onChange({ name: v })}
          placeholder="e.g. Baby Clothing"
          required
          maxLength={80}
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
              >
                {slugLocked ? (
                  <>
                    <Lock className="h-3 w-3" /> Auto
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" /> Manual
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onChange({ slug: slugify(value.name) })}
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
              placeholder="baby-clothing"
              className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white pl-3.5 pr-10 text-sm font-mono focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
            {value.slug && (
              <a
                href={`http://localhost:3000/products?category=${value.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg text-ink-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center"
                title="Preview on storefront"
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
          label="Description"
          value={value.description}
          onChange={(v) => onChange({ description: v })}
          placeholder="Short description shown on the category page and used as a fallback for SEO"
          textarea
          rows={4}
          maxLength={500}
          counter
          hint="Keep it focused — 50–160 characters works best for SEO"
        />
      </Section>

      {/* ─── Hierarchy ─── */}
      <Section
        title="Hierarchy"
        subtitle="Place this category within your navigation tree"
        icon={<FolderTree className="h-4 w-4 text-blue-500" />}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-700">
            Parent category
          </label>
          <select
            value={value.parentId}
            onChange={(e) => onChange({ parentId: e.target.value })}
            className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option value="">— None (top-level category) —</option>
            {parentOptions.map((opt) => (
              <option key={opt._id} value={opt._id}>
                {opt.label}
              </option>
            ))}
          </select>

          {parentOptions.length === 0 && (
            <div className="flex items-start gap-2 text-xs text-ink-500 bg-cream-50 border border-cream-200 rounded-lg px-3 py-2">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                No other top-level categories yet. Create another category
                first if you want to nest this under one.
              </span>
            </div>
          )}

          {value.parentId && (
            <p className="text-xs text-blue-600">
              This will appear under{" "}
              <strong>
                {parentOptions.find((p) => p._id === value.parentId)?.label ??
                  "the selected parent"}
              </strong>
              .
            </p>
          )}
        </div>

        <Field
          label="Sort order"
          value={String(value.sortOrder)}
          onChange={(v) => onChange({ sortOrder: Number(v) || 0 })}
          type="number"
          placeholder="0"
          hint="Lower numbers appear first within the parent"
          icon={<Hash className="h-3.5 w-3.5" />}
        />
      </Section>

      {/* ─── Visibility ─── */}
      <Section title="Visibility" subtitle="Control whether customers see this">
        <ToggleField
          label="Active"
          description="Visible in navigation and product filters. Turn off to hide without deleting."
          value={value.isActive}
          onChange={(v) => onChange({ isActive: v })}
        />
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Parent-option builder (2 levels max for dropdown)
// ═══════════════════════════════════════════════════════════

function buildParentOptions(
  categories: CategoryOption[],
  excludeId?: string
): { _id: string; label: string }[] {
  const roots = categories.filter((c) => !c.parentId);
  const childrenByParent = new Map<string, CategoryOption[]>();

  for (const c of categories) {
    if (!c.parentId) continue;
    const list = childrenByParent.get(c.parentId) ?? [];
    list.push(c);
    childrenByParent.set(c.parentId, list);
  }

  const options: { _id: string; label: string }[] = [];

  for (const root of roots) {
    if (root._id === excludeId) continue;
    options.push({ _id: root._id, label: root.name });

    // Skip children if this is the current category (can't nest under own child)
    const children = childrenByParent.get(root._id) ?? [];
    for (const child of children) {
      if (child._id === excludeId) continue;
      options.push({ _id: child._id, label: `   ${root.name} / ${child.name}` });
    }
  }

  return options;
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
  textarea,
  rows = 3,
  maxLength,
  counter,
  hint,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  maxLength?: number;
  counter?: boolean;
  hint?: string;
  icon?: React.ReactNode;
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
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className="w-full rounded-xl border-2 border-ink-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-y"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
      )}
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
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