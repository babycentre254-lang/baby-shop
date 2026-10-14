"use client";

import { useEffect, useRef, useState } from "react";
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

import { brandsApi } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import type { Brand } from "@baby-shop/shared";
import { BasicInfoTab, type BrandBasicValue } from "./basic-info-tab";
import { SeoTab, type BrandSeoValue } from "./seo-tab";

interface Props {
  mode: "create" | "edit";
  brand?: Brand;
}

interface FormState extends BrandBasicValue, BrandSeoValue {}

const INITIAL: FormState = {
  name: "",
  slug: "",
  description: "",
  logoUrl: null,
  website: "",
  isActive: true,
  metaTitle: "",
  metaDescription: "",
  ogImage: null,
};

const DRAFT_KEY = "babycentre:brand-form-draft";

type TabId = "basic" | "seo";

export function BrandForm({ mode, brand }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [dirty, setDirty] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);

  const [form, setForm] = useState<FormState>(() => {
    if (mode === "edit" && brand) {
      return {
        name: brand.name ?? "",
        slug: brand.slug ?? "",
        description: (brand as any).description ?? "",
        logoUrl: (brand as any).logoUrl ?? null,
        website: (brand as any).website ?? "",
        isActive: (brand as any).isActive ?? true,
        metaTitle: (brand as any).metaTitle ?? "",
        metaDescription: (brand as any).metaDescription ?? "",
        ogImage: (brand as any).ogImage ?? null,
      };
    }
    return INITIAL;
  });

  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (mode !== "create" || draftRestoredRef.current) return;
    draftRestoredRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const hasContent =
        parsed?.name?.trim() || parsed?.description?.trim() || parsed?.logoUrl;
      if (hasContent) {
        setForm({ ...INITIAL, ...parsed });
        setDraftNotice(true);
      }
    } catch {}
  }, [mode]);

  useEffect(() => {
    if (mode !== "create") return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        setDirty(true);
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [form, mode]);

  useEffect(() => {
    function h(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  useEffect(() => {
    function h(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        submit();
      }
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [form]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      mode === "create"
        ? brandsApi.create(payload)
        : brandsApi.update(brand!._id, payload),
    onSuccess: () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["brands"] });
      router.push("/dashboard/brands");
      router.refresh();
    },
   onError: (err: any) => {
  console.error("Save failed:", {
    message: err?.message,
    code: err?.code,
    status: err?.status,
    details: err?.details,
    full: err,
  });

  // Build a useful message
  let message = err?.message ?? "Could not save";
  if (err?.details && typeof err.details === "object") {
    const fields = Object.entries(err.details as Record<string, string[]>)
      .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
      .join(" · ");
    if (fields) message = `${message} — ${fields}`;
  }
  setError(message);
},
  });

  const deleteMutation = useMutation({
    mutationFn: () => brandsApi.remove(brand!._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      router.push("/dashboard/brands");
      router.refresh();
    },
    onError: (err: any) => setError(err?.message ?? "Could not delete"),
  });

const errors: Partial<Record<TabId, string[]>> = {};

if (!form.name.trim() || form.name.trim().length < 2) {
  errors.basic = ["Name is required (at least 2 characters)"];
} else if (!form.slug.trim()) {
  errors.basic = ["Slug is required"];
}

const hasErrors = Object.keys(errors).length > 0;

  function submit() {
    if (hasErrors) {
      setActiveTab("basic");
      setError(errors.basic?.[0] ?? "Please fix errors");
      return;
    }
    setError(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      logoUrl: form.logoUrl || undefined,
      website: form.website.trim() || undefined,
      isActive: form.isActive,
      metaTitle: form.metaTitle.trim() || undefined,
      metaDescription: form.metaDescription.trim() || undefined,
      ogImage: form.ogImage || undefined,
    };

    saveMutation.mutate(payload);
  }

  function resetForm() {
    if (!confirm("Reset all fields?")) return;
    setForm(INITIAL);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
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

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 pb-24 lg:pb-0">
      <div className="space-y-5 min-w-0">
        {draftNotice && mode === "create" && (
          <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Restored your last draft</p>
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

        {error && (
          <div className="rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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
                  logoUrl: form.logoUrl,
                  website: form.website,
                  isActive: form.isActive,
                }}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
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
                  logoUrl: form.logoUrl,
                }}
              />
            )}
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/brands"
              className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to brands
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
                  if (confirm("Delete this brand permanently?")) {
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
                  {mode === "create" ? "Create brand" : "Save changes"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right: preview */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <BrandPreview form={form} />
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

function BrandPreview({ form }: { form: FormState }) {
  return (
    <div className="rounded-2xl border-2 border-cream-300 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-ink-400" />
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
          Preview
        </p>
      </div>

      <div className="aspect-square rounded-2xl border-2 border-cream-200 bg-cream-50 flex items-center justify-center overflow-hidden mb-3">
        {form.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.logoUrl}
            alt={form.name}
            className="w-full h-full object-contain p-8"
          />
        ) : (
          <span className="text-4xl text-cream-400">🏷️</span>
        )}
      </div>

      <p className="text-sm font-medium text-ink-900">
        {form.name || "Untitled brand"}
      </p>
      {form.website && (
        <p className="text-xs text-blue-500 truncate mt-0.5">{form.website}</p>
      )}
      {form.description && (
        <p className="text-xs text-ink-500 line-clamp-3 mt-1.5">
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
      <Row
        label="Logo"
        value={form.logoUrl ? "Yes" : "No"}
        tone={form.logoUrl ? "success" : "muted"}
      />
      <Row
        label="Website"
        value={form.website ? "Linked" : "—"}
        tone={form.website ? "info" : "muted"}
      />
      <Row
        label="Description"
        value={form.description ? "Yes" : "—"}
        tone={form.description ? "success" : "muted"}
      />
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
  const c = {
    default: "text-ink-900",
    success: "text-sage-600",
    info: "text-blue-600",
    muted: "text-ink-500",
  }[tone];
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-500">{label}</span>
      <span className={cn("font-semibold", c)}>{value}</span>
    </div>
  );
}