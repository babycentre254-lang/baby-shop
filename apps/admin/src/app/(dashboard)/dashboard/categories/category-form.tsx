"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Search,
  Check,
  RotateCcw,
  Trash2,
  X,
  Info,
} from "lucide-react";

import { categoriesApi } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import type { Category } from "@baby-shop/shared";
import {
  BasicInfoTab,
  type CategoryBasicValue,
} from "./basic-info-tab";
import { SeoTab, type CategorySeoValue } from "./seo-tab";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

interface Props {
  mode: "create" | "edit";
  category?: Category;
  allCategories: {
    _id: string;
    name: string;
    slug: string;
    parentId?: string | null;
  }[];
}

interface FormState extends CategoryBasicValue, CategorySeoValue {}

const INITIAL: FormState = {
  // Basic
  name: "",
  slug: "",
  description: "",
  imageUrl: null,
  icon: "",
  parentId: "",
  sortOrder: 0,
  isActive: true,
  // SEO
  metaTitle: "",
  metaDescription: "",
  ogImage: null,
};

const DRAFT_KEY = "babycentre:category-form-draft";

type TabId = "basic" | "seo";

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function CategoryForm({ mode, category, allCategories }: Props) {
  const router = useRouter();
  const qc = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [dirty, setDirty] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);

  // ─── Bootstrap ──────────────────────────────────────────
  const [form, setForm] = useState<FormState>(() => {
    if (mode === "edit" && category) {
      return {
        name: category.name ?? "",
        slug: category.slug ?? "",
        description: (category as any).description ?? "",
        imageUrl: (category as any).imageUrl ?? null,
        icon: (category as any).icon ?? "",
        parentId: (category as any).parentId?.toString?.() ?? "",
        sortOrder: (category as any).sortOrder ?? 0,
        isActive: (category as any).isActive ?? true,
        metaTitle: (category as any).metaTitle ?? "",
        metaDescription: (category as any).metaDescription ?? "",
        ogImage: (category as any).ogImage ?? null,
      };
    }
    return INITIAL;
  });

  // ─── Restore draft after mount ──────────────────────────
  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (mode !== "create" || draftRestoredRef.current) return;
    draftRestoredRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const hasContent =
        parsed?.name?.trim() ||
        parsed?.description?.trim() ||
        parsed?.imageUrl;
      if (hasContent) {
        setForm({ ...INITIAL, ...parsed });
        setDraftNotice(true);
      }
    } catch {
      /* ignore */
    }
  }, [mode]);

  // ─── Autosave ───────────────────────────────────────────
  useEffect(() => {
    if (mode !== "create") return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        setDirty(true);
      } catch {
        /* ignore */
      }
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, mode]);

  // ─── Unsaved-changes warning ────────────────────────────
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ─── Ctrl+S save ────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        submit();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // ─── Mutations ──────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      mode === "create"
        ? categoriesApi.create(payload)
        : categoriesApi.update(category!._id, payload),
    onSuccess: () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["categories"] });
      router.push("/dashboard/categories");
      router.refresh();
    },
    onError: (err: any) => setError(err?.message ?? "Could not save"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => categoriesApi.remove(category!._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      router.push("/dashboard/categories");
      router.refresh();
    },
    onError: (err: any) => setError(err?.message ?? "Could not delete"),
  });

  // ─── Validation ─────────────────────────────────────────
  const errors = useMemo(() => {
    const e: Partial<Record<TabId, string[]>> = {};

    const basic: string[] = [];
    if (!form.name.trim()) basic.push("Name is required");
    else if (form.name.trim().length < 2) basic.push("Name is too short");
    if (!form.slug.trim()) basic.push("Slug is required");
    if (basic.length) e.basic = basic;

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  function submit() {
    if (hasErrors) {
      const firstTab = (Object.keys(errors) as TabId[])[0];
      setActiveTab(firstTab);
      setError(errors[firstTab]?.[0] ?? "Please fix errors");
      return;
    }
    setError(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl || undefined,
      icon: form.icon || undefined,
      parentId: form.parentId || null,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
      metaTitle: form.metaTitle.trim() || undefined,
      metaDescription: form.metaDescription.trim() || undefined,
      ogImage: form.ogImage || undefined,
    };

    saveMutation.mutate(payload);
  }

  function resetForm() {
    if (!confirm("Reset all fields? Unsaved changes will be lost.")) return;
    setForm(INITIAL);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setDirty(false);
    setDraftNotice(false);
  }

  const tabs: {
    id: TabId;
    label: string;
    icon: typeof FileText;
    complete: boolean;
    hasError: boolean;
  }[] = [
    {
      id: "basic",
      label: "Basic Info",
      icon: FileText,
      complete: !!form.name && !!form.slug,
      hasError: !!errors.basic,
    },
    {
      id: "seo",
      label: "SEO & Social",
      icon: Search,
      complete: !!(form.metaTitle && form.metaDescription),
      hasError: false,
    },
  ];

  const parentName = form.parentId
    ? allCategories.find((c) => c._id === form.parentId)?.name
    : undefined;

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 pb-24 lg:pb-0">
      <div className="space-y-5 min-w-0">
        {/* Draft notice */}
        {draftNotice && mode === "create" && (
          <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Restored your last draft</p>
              <p className="text-xs mt-0.5">
                Your previous unsaved work was restored.
              </p>
            </div>
            <button
              onClick={() => {
                setDraftNotice(false);
                setForm(INITIAL);
                try {
                  localStorage.removeItem(DRAFT_KEY);
                } catch {}
              }}
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
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
          <div className="border-b border-cream-200 bg-cream-50 overflow-x-auto">
            <div className="flex items-center gap-1 px-2 py-2 min-w-max">
              {tabs.map(({ id, label, icon: Icon, complete, hasError }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-colors",
                    activeTab === id
                      ? "bg-white text-ink-900 shadow-sm border border-cream-200"
                      : "text-ink-500 hover:text-ink-800 hover:bg-white/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {complete && !hasError && (
                    <Check className="h-3 w-3 text-sage-500" />
                  )}
                  {hasError && (
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "basic" && (
              <BasicInfoTab
                value={{
                  name: form.name,
                  slug: form.slug,
                  description: form.description,
                  imageUrl: form.imageUrl,
                  icon: form.icon,
                  parentId: form.parentId,
                  sortOrder: form.sortOrder,
                  isActive: form.isActive,
                }}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                categories={allCategories}
                currentId={category?._id}
              />
            )}
            {activeTab === "seo" && (
              <SeoTab
                value={{
                  metaTitle: form.metaTitle,
                  metaDescription: form.metaDescription,
                  ogImage: form.ogImage,
                }}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                context={{
                  name: form.name,
                  slug: form.slug,
                  description: form.description,
                  parentName,
                  imageUrl: form.imageUrl,
                }}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="hidden lg:flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/categories"
              className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to categories
            </Link>
            {dirty && (
              <span className="text-xs text-ink-400">• Unsaved changes</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-medium text-ink-600 hover:bg-cream-100"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            {mode === "edit" && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this category permanently?")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-medium text-pink-600 hover:bg-pink-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  {mode === "create" ? "Create category" : "Save changes"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Right: summary ─── */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <CategoryPreview form={form} parentName={parentName} />
          <SummaryCard form={form} />
        </div>
      </aside>

      {/* Mobile action bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-cream-200 px-3 py-3 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={saveMutation.isPending}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            {saveMutation.isPending
              ? "Saving…"
              : mode === "create"
              ? "Create"
              : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Preview & Summary
// ═══════════════════════════════════════════════════════════

function CategoryPreview({
  form,
  parentName,
}: {
  form: FormState;
  parentName?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-cream-300 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-ink-400" />
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
          Tile preview
        </p>
      </div>

      <div className="aspect-square rounded-2xl border-2 border-cream-200 bg-cream-50 overflow-hidden relative mb-3">
        {form.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.imageUrl}
            alt={form.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-cream-400">
            <span className="text-6xl">{form.icon || "🎁"}</span>
          </div>
        )}

        {form.icon && form.imageUrl && (
          <div className="absolute top-2 left-2 h-10 w-10 rounded-full bg-white shadow flex items-center justify-center text-2xl">
            {form.icon}
          </div>
        )}
      </div>

      {parentName && (
        <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider mb-0.5">
          {parentName}
        </p>
      )}
      <p className="text-sm font-medium text-ink-900">
        {form.name || "Untitled category"}
      </p>
      {form.description && (
        <p className="text-xs text-ink-500 line-clamp-2 mt-0.5">
          {form.description}
        </p>
      )}
      {!form.isActive && (
        <span className="inline-block mt-2 text-[10px] font-semibold text-ink-500 bg-cream-100 px-2 py-0.5 rounded">
          HIDDEN
        </span>
      )}
    </div>
  );
}

function SummaryCard({ form }: { form: FormState }) {
  return (
    <div className="rounded-2xl border-2 border-cream-300 bg-white p-4 space-y-2">
      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
        Summary
      </p>
      <Row label="Image" value={form.imageUrl ? "Yes" : "No"} tone={form.imageUrl ? "success" : "muted"} />
      <Row label="Icon" value={form.icon || "Default"} tone={form.icon ? "success" : "muted"} />
      <Row
        label="Parent"
        value={form.parentId ? "Nested" : "Top-level"}
        tone="info"
      />
      <Row label="Sort order" value={String(form.sortOrder)} />
      <Row
        label="Status"
        value={form.isActive ? "Active" : "Hidden"}
        tone={form.isActive ? "success" : "muted"}
      />
    </div>
  );
}

function Row({
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