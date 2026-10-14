"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Save,
  AlertCircle,
  ArrowLeft,
  Rocket,
  FileText,
  Package,
  DollarSign,
  Boxes,
  Image as ImageIcon,
  Search,
  Truck,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trash2,
  Eye,
  X,
  Info,
} from "lucide-react";

import { productsApi } from "@/lib/api/endpoints";
import { cn, formatKES } from "@/lib/utils";
import type { Product } from "@baby-shop/shared";
import { SeoTab, type SeoValue } from "./seo-tab";
import { BasicInfoTab, type BasicInfoValue } from "./basic-info-tab";
import { ImageManager, type ProductImageDraft } from "./image-manager";
import {
  VariantMatrix,
  type VariantDraft,
  type AttributeState,
} from "./variant-matrix";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

interface Props {
  mode: "create" | "edit";
  product?: Product;
  categories: { _id: string; name: string }[];
  brands: { _id: string; name: string }[];
}

interface FormState {
  name: string;
  slug: string;
  shortDesc: string;
  description: string;
  categoryId: string;
  brandId: string;
  basePrice: number;
  salePrice: number | null;
  sku: string;
  ageRange: string;
  material: string;
  safetyCerts: string[];
  isPublished: boolean;
  isFeatured: boolean;
  images: ProductImageDraft[];
  variants: VariantDraft[];
  attributes: AttributeState;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string; 
  weight: string;
  dimensions: string;
}

type TabId = "basic" | "pricing" | "inventory" | "images" | "seo";

const INITIAL: FormState = {
  name: "",
  slug: "",
  shortDesc: "",
  description: "",
  categoryId: "",
  brandId: "",
  basePrice: 0,
  salePrice: null,
  sku: "",
  ageRange: "",
  material: "",
  safetyCerts: [],
  isPublished: false,
  isFeatured: false,
  images: [],
  variants: [],
  attributes: { sizes: [], colors: [] },
  metaTitle: "",
  metaDescription: "",
  focusKeyword: "",  
  weight: "",
  dimensions: "",
};

const DRAFT_KEY = "babycentre:product-form-draft";

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function genSku(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .split("-")
    .filter(Boolean)
    .map((p) => p.slice(0, 4))
    .join("-");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suffix}`.slice(0, 50);
}

// ═══════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════

export function ProductForm({ mode, product, categories, brands }: Props) {
  const router = useRouter();
  const qc = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);

  // ─── Bootstrap form ─────────────────────────────────────
const [form, setForm] = useState<FormState>(() => {
  // Edit mode: bootstrap from the product (this is safe — same on server & client)
  if (mode === "edit" && product) {
    const variants: VariantDraft[] = ((product as any).variants ?? []).map(
      (v: any) => ({
        id: v._id ?? crypto.randomUUID(),
        sku: v.sku,
        size: v.size ?? "",
        color: v.color ?? "",
        price: v.price,
        stock: v.stock,
        lowStockAt: v.lowStockAt ?? 5,
      })
    );

    const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
    const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

    return {
      name: product.name ?? "",
      slug: product.slug ?? "",
      shortDesc: (product as any).shortDesc ?? "",
      description: product.description ?? "",
      categoryId: (product.categoryId as any)?.toString?.() ?? "",
      brandId: ((product as any).brandId as any)?.toString?.() ?? "",
      basePrice: product.basePrice ?? 0,
      salePrice: (product as any).salePrice ?? null,
      sku: (product as any).sku ?? "",
      ageRange: (product as any).ageRange ?? "",
      material: (product as any).material ?? "",
      safetyCerts: (product as any).safetyCerts ?? [],
      isPublished: (product as any).isPublished ?? false,
      isFeatured: (product as any).isFeatured ?? false,
      images: ((product as any).images ?? []).map(
        (img: any, i: number) => ({
          id: img._id ?? crypto.randomUUID(),
          url: img.url,
          altText: img.altText ?? "",
          sortOrder: img.sortOrder ?? i,
        })
      ),
      variants,
      attributes: { sizes: sizes as string[], colors: colors as string[] },
      metaTitle: "",
      metaDescription: "",
      focusKeyword: (product as any).focusKeyword ?? "",
      weight: "",
      dimensions: "",
    };
  }

  // Create mode: always start from INITIAL on both server & client.
  // The draft is restored in a useEffect (below) so server & client match.
  return INITIAL;
});

  // ─── Autosave draft (create mode only) ──────────────────
  useEffect(() => {
    if (mode !== "create") return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        setDirty(true);
      } catch {
        /* ignore quota errors */
      }
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, mode]);

  // ─── Auto-slug + auto-sku ───────────────────────────────
  useEffect(() => {
    if (mode === "create" && form.name && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  useEffect(() => {
    if (mode === "create" && form.name && !form.sku) {
      setForm((f) => ({ ...f, sku: genSku(f.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  // ─── Warn on unload if dirty ────────────────────────────
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ─── Keyboard shortcut: Ctrl/Cmd+S to save draft ────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        submit(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // ─── Mutation ───────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (payload: any) =>
      mode === "create"
        ? productsApi.create(payload)
        : productsApi.update(product!._id, payload),
    onSuccess: () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["products"] });
      router.push("/dashboard/products");
      router.refresh();
    },
    onError: (err: any) => {
      setError(err?.message ?? "Could not save product");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.remove(product!._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      router.push("/dashboard/products");
      router.refresh();
    },
    onError: (err: any) => setError(err?.message ?? "Could not delete"),
  });

  // ─── Validation (returns per-tab errors) ────────────────
  const errors = useMemo(() => {
    const e: Partial<Record<TabId, string[]>> = {};

    // Basic
    const basic: string[] = [];
    if (!form.name.trim()) basic.push("Product name is required");
    else if (form.name.trim().length < 2) basic.push("Name is too short");
    if (!form.categoryId) basic.push("Category is required");
    const descriptionText = form.description.replace(/<[^>]*>/g, "").trim();
    if (descriptionText.length < 10)
      basic.push("Description must be at least 10 characters");
    if (basic.length) e.basic = basic;

    // Pricing
    const pricing: string[] = [];
    if (form.basePrice <= 0) pricing.push("Base price must be greater than 0");
    if (form.salePrice != null && form.salePrice >= form.basePrice)
      pricing.push("Sale price must be lower than base price");
    if (pricing.length) e.pricing = pricing;

    // Inventory
    const inventory: string[] = [];
    if (!form.sku.trim()) inventory.push("Master SKU is required");
    const skus = form.variants.map((v) => v.sku);
    const dupes = skus.filter((s, i) => skus.indexOf(s) !== i);
    if (dupes.length)
      inventory.push(`Duplicate variant SKUs: ${[...new Set(dupes)].join(", ")}`);
    if (form.variants.some((v) => v.price <= 0))
      inventory.push("Some variants have price 0");
    if (inventory.length) e.inventory = inventory;

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;
  const errorCount = Object.values(errors).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  function validate(): string | null {
    if (hasErrors) {
      // Jump to the first tab with an error
      const firstTab = (Object.keys(errors) as TabId[])[0];
      setActiveTab(firstTab);
      return errors[firstTab]?.[0] ?? "Please fix the errors";
    }
    return null;
  }

  // ─── Submit ─────────────────────────────────────────────
  function submit(publish: boolean) {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      shortDesc: form.shortDesc.trim() || undefined,
      categoryId: form.categoryId,
      brandId: form.brandId || undefined,
      basePrice: form.basePrice,
      salePrice: form.salePrice ?? undefined,
      sku: form.sku.trim(),
      ageRange: form.ageRange.trim() || undefined,
      material: form.material.trim() || undefined,
      safetyCerts: form.safetyCerts,
      isPublished: publish ? true : form.isPublished,
      isFeatured: form.isFeatured,
      images: form.images
        .filter((img) => img.url && !img.uploading)
        .map((img, i) => ({
          url: img.url,
          altText: img.altText || undefined,
          sortOrder: i,
        })),
      variants: form.variants.map((v) => ({
        sku: v.sku.trim(),
        size: v.size.trim() || undefined,
        color: v.color.trim() || undefined,
        price: v.price,
        stock: v.stock,
        lowStockAt: v.lowStockAt,
      })),
    };

    mutation.mutate(payload);
  }

  function resetForm() {
    if (!confirm("Reset all fields? Unsaved changes will be lost.")) return;
    setForm(mode === "edit" ? INITIAL : INITIAL);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setDirty(false);
    setDraftNotice(false);
  }

  function dismissDraftNotice() {
    setDraftNotice(false);
    // Re-bootstrap a clean form
    setForm(INITIAL);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }

  // ─── Tab metadata ───────────────────────────────────────
  const tabs: {
    id: TabId;
    label: string;
    shortLabel: string;
    icon: typeof FileText;
    complete: boolean;
    hasError: boolean;
  }[] = [
    {
      id: "basic",
      label: "Basic Info",
      shortLabel: "Basic",
      icon: FileText,
      complete:
      !!form.name &&
      !!form.categoryId &&
      form.description.replace(/<[^>]*>/g, "").trim().length >= 10,
      hasError: !!errors.basic,
    },
    {
      id: "pricing",
      label: "Pricing",
      shortLabel: "Price",
      icon: DollarSign,
      complete: form.basePrice > 0,
      hasError: !!errors.pricing,
    },
    {
      id: "inventory",
      label: "Inventory & Variants",
      shortLabel: "Stock",
      icon: Boxes,
      complete: !!form.sku && form.variants.length > 0,
      hasError: !!errors.inventory,
    },
    {
      id: "images",
      label: "Images",
      shortLabel: "Images",
      icon: ImageIcon,
      complete: form.images.length > 0,
      hasError: false,
    },
    {
      id: "seo",
      label: "SEO & Shipping",
      shortLabel: "SEO",
      icon: Search,
      complete: false,
      hasError: false,
    },
  ];

  const totalStock = form.variants.reduce((s, v) => s + (v.stock || 0), 0);

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 pb-24 lg:pb-0">
      {/* ─── Main column ─── */}
      <div className="space-y-5 min-w-0">
        {/* Draft restore banner */}
        {draftNotice && mode === "create" && (
          <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Restored your last draft</p>
              <p className="text-xs mt-0.5">
                Your previous unsaved work was restored from this browser.
              </p>
            </div>
            <button
              onClick={dismissDraftNotice}
              className="text-yellow-700 hover:text-yellow-900 text-xs font-medium underline"
            >
              Start fresh
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-pink-500 hover:text-pink-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Validation summary */}
        {hasErrors && (
          <div className="rounded-xl border-2 border-cream-300 bg-cream-50 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-ink-800 font-medium mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              {errorCount} issue{errorCount !== 1 ? "s" : ""} to fix
            </div>
            <ul className="space-y-1 text-xs text-ink-600">
              {(Object.keys(errors) as TabId[]).map((tabId) => (
                <li key={tabId}>
                  <button
                    onClick={() => setActiveTab(tabId)}
                    className="hover:text-blue-600 underline"
                  >
                    <span className="font-medium capitalize">{tabId}:</span>{" "}
                    {errors[tabId]?.[0]}
                    {(errors[tabId]?.length ?? 0) > 1 &&
                      ` (+${errors[tabId]!.length - 1} more)`}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tabs card */}
        <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
          {/* Tab bar */}
          <div className="border-b border-cream-200 bg-cream-50 overflow-x-auto">
            <div className="flex items-center gap-1 px-2 py-2 min-w-max">
              {tabs.map(({ id, label, shortLabel, icon: Icon, complete, hasError }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "relative inline-flex items-center gap-2 h-10 px-3 sm:px-4 rounded-xl text-sm font-medium transition-colors",
                    activeTab === id
                      ? "bg-white text-ink-900 shadow-sm border border-cream-200"
                      : "text-ink-500 hover:text-ink-800 hover:bg-white/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{shortLabel}</span>
                  {complete && !hasError && (
                    <Check className="h-3 w-3 text-sage-500 shrink-0" />
                  )}
                  {hasError && (
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-4 sm:p-6">
            {activeTab === "basic" && (
              <BasicInfoTab
                value={{
                  name: form.name,
                  slug: form.slug,
                  shortDesc: form.shortDesc,
                  description: form.description,
                  categoryId: form.categoryId,
                  brandId: form.brandId,
                  ageRange: form.ageRange,
                  material: form.material,
                  safetyCerts: form.safetyCerts,
                  isFeatured: form.isFeatured,
                  isPublished: form.isPublished,
                }}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                categories={categories}
                brands={brands}
              />
            )}
            {activeTab === "pricing" && (
              <PricingTab form={form} setForm={setForm} />
            )}
            {activeTab === "inventory" && (
              <InventoryTab form={form} setForm={setForm} />
            )}
            {activeTab === "images" && (
              <ImagesTab form={form} setForm={setForm} />
            )}
            {activeTab === "seo" && (
  <SeoTab
    value={{
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      focusKeyword: form.focusKeyword,
      weight: form.weight,
      dimensions: form.dimensions,
    }}
    onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
    context={{
      name: form.name,
      slug: form.slug,
      description: form.description,
      shortDesc: form.shortDesc,
      categoryName:
        categories.find((c) => c._id === form.categoryId)?.name ?? "",
      brandName:
        brands.find((b) => b._id === form.brandId)?.name ?? "",
      basePrice: form.basePrice,
      salePrice: form.salePrice,
      imageCount: form.images.length,
      imageAlts: form.images.map((img) => img.altText || ""),
      ageRange: form.ageRange,
      material: form.material,
      safetyCerts: form.safetyCerts,
    }}
  />
)}
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/products"
              className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to products
            </Link>
            {dirty && (
              <span className="text-xs text-ink-400">• Unsaved changes</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-medium text-ink-600 hover:bg-cream-100 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            {mode === "edit" && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this product permanently?")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-medium text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={() => submit(false)}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border-2 border-ink-200 bg-white text-sm font-semibold text-ink-700 hover:bg-cream-100 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save draft
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => submit(true)}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Publish
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Preview column (desktop) ─── */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <PreviewCard form={form} />
          <SummaryCard
            form={form}
            totalStock={totalStock}
            tabs={tabs}
            onJump={setActiveTab}
          />
        </div>
      </aside>

      {/* ─── Mobile actions bar (fixed) ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-cream-200 px-3 py-3 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewMobile(true)}
            className="h-11 w-11 rounded-xl border-2 border-ink-200 bg-white text-ink-600 flex items-center justify-center shrink-0"
            aria-label="Preview"
          >
            <Eye className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => submit(false)}
            disabled={mutation.isPending}
            className="flex-1 h-11 rounded-xl border-2 border-ink-200 bg-white text-sm font-semibold text-ink-700 disabled:opacity-50"
          >
            {mutation.isPending ? "Saving…" : "Draft"}
          </button>

          <button
            type="button"
            onClick={() => submit(true)}
            disabled={mutation.isPending}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            {mutation.isPending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {/* ─── Mobile preview sheet ─── */}
      {showPreviewMobile && (
        <div className="lg:hidden fixed inset-0 z-40 bg-ink-900/50">
          <div
            className="absolute inset-0"
            onClick={() => setShowPreviewMobile(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-cream-100 rounded-t-3xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink-900">Preview</h3>
              <button
                onClick={() => setShowPreviewMobile(false)}
                className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-ink-600"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <PreviewCard form={form} />
            <div className="h-6" />
            <SummaryCard
              form={form}
              totalStock={totalStock}
              tabs={tabs}
              onJump={(id) => {
                setActiveTab(id);
                setShowPreviewMobile(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Preview & Summary
// ═══════════════════════════════════════════════════════════

function PreviewCard({ form }: { form: FormState }) {
  const discount =
    form.salePrice != null && form.salePrice < form.basePrice
      ? Math.round(((form.basePrice - form.salePrice) / form.basePrice) * 100)
      : 0;

  return (
    <div className="rounded-2xl border-2 border-cream-300 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-ink-400" />
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
          Storefront preview
        </p>
      </div>

      <div className="aspect-[4/5] rounded-xl bg-cream-100 border-2 border-cream-200 overflow-hidden relative mb-3">
        {form.images[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.images[0].url}
            alt={form.images[0].altText || form.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream-400">
            <ImageIcon className="h-12 w-12" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold">
            -{discount}%
          </span>
        )}
        {form.isFeatured && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
            Featured
          </span>
        )}
      </div>

      {form.ageRange && (
        <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider mb-0.5">
          {form.ageRange}
        </p>
      )}
      <p className="text-sm font-medium text-ink-900 line-clamp-2">
        {form.name || "Untitled product"}
      </p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-semibold text-lg text-ink-900">
          {formatKES(form.salePrice ?? form.basePrice)}
        </span>
        {discount > 0 && (
          <span className="text-xs text-ink-400 line-through">
            {formatKES(form.basePrice)}
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  form,
  totalStock,
  tabs,
  onJump,
}: {
  form: FormState;
  totalStock: number;
  tabs: { id: TabId; label: string; complete: boolean; hasError: boolean }[];
  onJump: (id: TabId) => void;
}) {
  const completedCount = tabs.filter((t) => t.complete).length;
  const completion = Math.round((completedCount / tabs.length) * 100);

  return (
    <div className="rounded-2xl border-2 border-cream-300 bg-white p-4 space-y-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
            Progress
          </p>
          <span className="text-xs font-semibold text-ink-800">
            {completion}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-cream-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-pink-500 transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
        <div className="grid grid-cols-5 gap-1.5 mt-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onJump(t.id)}
              title={t.label}
              className={cn(
                "h-1.5 rounded-full transition-colors",
                t.hasError
                  ? "bg-pink-500"
                  : t.complete
                  ? "bg-sage-500"
                  : "bg-cream-300"
              )}
            />
          ))}
        </div>
      </div>

      {/* Summary rows */}
      <div className="space-y-2 pt-2 border-t border-cream-200">
        <SummaryRow label="Variants" value={String(form.variants.length)} />
        <SummaryRow label="Stock" value={`${totalStock} units`} />
        <SummaryRow label="Images" value={String(form.images.length)} />
        <SummaryRow
          label="Status"
          value={form.isPublished ? "Published" : "Draft"}
          tone={form.isPublished ? "success" : "muted"}
        />
        {form.isFeatured && (
          <SummaryRow label="Featured" value="Yes" tone="info" />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tabs
// ═══════════════════════════════════════════════════════════

function BasicTab({
  form,
  setForm,
  categories,
  brands,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  categories: { _id: string; name: string }[];
  brands: { _id: string; name: string }[];
}) {
  return (
    <div className="space-y-5">
      <Field
        label="Product name"
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        placeholder="e.g. Organic Cotton Onesie"
        required
        maxLength={200}
      />

      <Field
        label="Slug"
        value={form.slug}
        onChange={(v) => setForm({ ...form, slug: v })}
        placeholder="organic-cotton-onesie"
        hint="URL: /products/your-slug"
      />

      <Field
        label="Short description"
        value={form.shortDesc}
        onChange={(v) => setForm({ ...form, shortDesc: v })}
        placeholder="One-line summary shown in listings"
        maxLength={300}
        counter
      />

      <Field
        label="Full description"
        value={form.description}
        onChange={(v) => setForm({ ...form, description: v })}
        placeholder="Detailed product information, features, care instructions..."
        textarea
        rows={6}
        required
        maxLength={5000}
        counter
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <SelectField
          label="Category"
          value={form.categoryId}
          onChange={(v) => setForm({ ...form, categoryId: v })}
          options={categories.map((c) => ({ value: c._id, label: c.name }))}
          placeholder="Select a category"
          required
        />
        <SelectField
          label="Brand"
          value={form.brandId}
          onChange={(v) => setForm({ ...form, brandId: v })}
          options={brands.map((b) => ({ value: b._id, label: b.name }))}
          placeholder="No brand"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Age range"
          value={form.ageRange}
          onChange={(v) => setForm({ ...form, ageRange: v })}
          placeholder="e.g. 0-3M, 6-12M"
          maxLength={40}
        />
        <Field
          label="Material"
          value={form.material}
          onChange={(v) => setForm({ ...form, material: v })}
          placeholder="e.g. 100% organic cotton"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-ink-700">
          Safety certifications
        </label>
        <div className="flex flex-wrap gap-2">
          {["OEKO-TEX", "CE", "ASTM", "CPSIA", "BPA-free"].map((cert) => {
            const active = form.safetyCerts.includes(cert);
            return (
              <button
                key={cert}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    safetyCerts: active
                      ? form.safetyCerts.filter((c) => c !== cert)
                      : [...form.safetyCerts, cert],
                  })
                }
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border-2 transition-colors",
                  active
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-ink-600 border-ink-200 hover:border-blue-300"
                )}
              >
                {active && <Check className="h-3 w-3" />}
                {cert}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-2">
        <ToggleField
          label="Featured product"
          description="Show in the Featured section on the homepage"
          value={form.isFeatured}
          onChange={(v) => setForm({ ...form, isFeatured: v })}
        />
        <ToggleField
          label="Published"
          description="Visible to customers immediately"
          value={form.isPublished}
          onChange={(v) => setForm({ ...form, isPublished: v })}
        />
      </div>
    </div>
  );
}

function PricingTab({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const discount =
    form.salePrice != null && form.salePrice < form.basePrice
      ? Math.round(((form.basePrice - form.salePrice) / form.basePrice) * 100)
      : 0;

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Base price (KSh)"
          type="number"
          value={String(form.basePrice)}
          onChange={(v) => setForm({ ...form, basePrice: Number(v) || 0 })}
          placeholder="1200"
          required
        />
        <Field
          label="Sale price (KSh)"
          type="number"
          value={form.salePrice != null ? String(form.salePrice) : ""}
          onChange={(v) =>
            setForm({ ...form, salePrice: v ? Number(v) || null : null })
          }
          placeholder="Leave blank for no sale"
        />
      </div>

      {discount > 0 && (
        <div className="rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800 flex items-center gap-2">
          <DollarSign className="h-4 w-4 shrink-0" />
          <span>
            <strong>{discount}% off</strong> — customers save{" "}
            {formatKES(form.basePrice - (form.salePrice ?? 0))} per unit.
          </span>
        </div>
      )}

      <div className="rounded-xl bg-cream-50 border border-cream-200 p-4">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
          Margin calculator
        </p>
        <p className="text-xs text-ink-500 mb-3">
          Enter your cost per unit to see estimated margin. Not stored.
        </p>
        <MarginCalculator
          basePrice={form.basePrice}
          salePrice={form.salePrice}
        />
      </div>
    </div>
  );
}

function MarginCalculator({
  basePrice,
  salePrice,
}: {
  basePrice: number;
  salePrice: number | null;
}) {
  const [cost, setCost] = useState("");
  const costNum = Number(cost) || 0;
  const price = salePrice ?? basePrice;
  const profit = price - costNum;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  return (
    <div className="space-y-3">
      <input
        type="number"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
        placeholder="Your cost per unit (KSh)"
        className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none"
      />
      {costNum > 0 && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">Profit per unit</span>
            <span
              className={cn(
                "font-semibold",
                profit >= 0 ? "text-sage-600" : "text-pink-600"
              )}
            >
              {formatKES(profit)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">Margin</span>
            <span className="font-semibold text-ink-900">
              {margin.toFixed(1)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function InventoryTab({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <div className="space-y-5">
      <Field
        label="Master SKU"
        value={form.sku}
        onChange={(v) => setForm({ ...form, sku: v })}
        placeholder="ONES-ORG-001"
        hint="Unique identifier for accounting & fulfilment"
        required
        maxLength={50}
      />

      <div className="rounded-2xl bg-blue-50 border-2 border-blue-100 p-3 sm:p-4">
        <p className="text-sm font-medium text-blue-800 mb-1">
          Variant builder
        </p>
        <p className="text-xs text-blue-700 mb-4">
          Add sizes and colors, then click Generate to auto-create every
          combination with SKUs. Edit each row's price and stock individually,
          or select multiple rows for bulk edit.
        </p>

        <VariantMatrix
          variants={form.variants}
          onChange={(variants) => setForm({ ...form, variants })}
          attributes={form.attributes ?? { sizes: [], colors: [] }}
          onAttributesChange={(attributes) => setForm({ ...form, attributes })}
          basePrice={form.basePrice}
          productName={form.name}
        />
      </div>
    </div>
  );
}

function ImagesTab({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-ink-800 mb-1">
          Product images
        </p>
        <p className="text-xs text-ink-500 mb-4">
          Drag to reorder. The first image is the thumbnail shown in listings.
        </p>
      </div>

      <ImageManager
        images={form.images}
        onChange={(images) => setForm({ ...form, images })}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Form primitives
// ═══════════════════════════════════════════════════════════

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  hint?: string;
  maxLength?: number;
  counter?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  textarea,
  rows = 3,
  hint,
  maxLength,
  counter,
}: FieldProps) {
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
        <label className="block text-sm font-medium text-ink-700">
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

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink-700">
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

function SummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "info" | "muted";
}) {
  const toneClass = {
    default: "text-ink-900",
    success: "text-sage-600",
    info: "text-blue-600",
    muted: "text-ink-500",
  }[tone];

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-500">{label}</span>
      <span className={cn("font-semibold", toneClass)}>{value}</span>
    </div>
  );
}
