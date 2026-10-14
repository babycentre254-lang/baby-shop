"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  Wand2,
  Check,
  X,
  AlertTriangle,
  Copy,
  Gauge,
  Share2,
  MessageCircle,
  Image as ImageIcon,
  TrendingUp,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImagePicker } from "./image-picker";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface CategorySeoValue {
  metaTitle: string;
  metaDescription: string;
  ogImage: string | null;
}

interface Props {
  value: CategorySeoValue;
  onChange: (patch: Partial<CategorySeoValue>) => void;
  context: {
    name: string;
    slug: string;
    description: string;
    parentName?: string;
    productCount?: number;
    imageUrl?: string | null;
  };
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trim() + "…";
}

function genMetaTitle(ctx: Props["context"]): string {
  // Attempt: "Parent | Name | BabyCentre" → "Name | BabyCentre" → "Name"
  if (ctx.parentName) {
    const full = `${ctx.parentName} ${ctx.name} | BabyCentre`;
    if (full.length <= 60) return full;
  }

  const nameOnly = `${ctx.name} | BabyCentre`;
  if (nameOnly.length <= 60) return nameOnly;

  return truncate(ctx.name, 60);
}

function genMetaDescription(ctx: Props["context"]): string {
  // Use existing description if it's substantial
  if (ctx.description && ctx.description.length >= 80) {
    return truncate(ctx.description, 155);
  }

  // Compose from name + parent + CTA
  const intro = ctx.parentName
    ? `Shop our ${ctx.name.toLowerCase()} collection — part of ${ctx.parentName} at BabyCentre.`
    : `Shop our ${ctx.name.toLowerCase()} collection at BabyCentre.`;

  const cta =
    " Safe, thoughtfully made products. Free shipping over KSh 5,000, same-day Nairobi delivery.";

  const composed = `${intro}${cta}`;
  if (composed.length <= 155) return composed;

  // If description exists but is short, prefer it with a shorter CTA
  if (ctx.description) {
    const withShortCta = `${ctx.description} Free delivery available.`;
    return truncate(withShortCta, 155);
  }

  return truncate(intro + " Fast delivery countrywide.", 155);
}

// ═══════════════════════════════════════════════════════════
// Analysis
// ═══════════════════════════════════════════════════════════

interface Check {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
  weight: number;
}

function analyze(
  value: CategorySeoValue,
  ctx: Props["context"]
): { score: number; checks: Check[] } {
  const checks: Check[] = [];

  // ─── Title ────────────────────────────────────────
  if (!value.metaTitle) {
    checks.push({
      id: "title-present",
      label: "Meta title present",
      status: "fail",
      message: "Add a meta title (30–60 characters)",
      weight: 15,
    });
  } else {
    const len = value.metaTitle.length;
    checks.push({
      id: "title-present",
      label: "Meta title present",
      status: "pass",
      message: "Meta title is set",
      weight: 15,
    });

    if (len < 30) {
      checks.push({
        id: "title-length",
        label: "Title length",
        status: "warn",
        message: `Too short (${len}/60). Aim for 30–60.`,
        weight: 10,
      });
    } else if (len > 60) {
      checks.push({
        id: "title-length",
        label: "Title length",
        status: "warn",
        message: `Too long (${len}/60) — will be truncated`,
        weight: 10,
      });
    } else {
      checks.push({
        id: "title-length",
        label: "Title length",
        status: "pass",
        message: `Good length (${len}/60)`,
        weight: 10,
      });
    }

    const nameInTitle = value.metaTitle
      .toLowerCase()
      .includes(ctx.name.toLowerCase());
    checks.push({
      id: "title-has-name",
      label: "Category name in title",
      status: nameInTitle ? "pass" : "warn",
      message: nameInTitle
        ? "Category name appears in the title"
        : "Include the category name in the title",
      weight: 8,
    });
  }

  // ─── Description ──────────────────────────────────
  if (!value.metaDescription) {
    checks.push({
      id: "desc-present",
      label: "Meta description present",
      status: "fail",
      message: "Add a meta description (120–155 characters)",
      weight: 15,
    });
  } else {
    const len = value.metaDescription.length;
    checks.push({
      id: "desc-present",
      label: "Meta description present",
      status: "pass",
      message: "Meta description is set",
      weight: 15,
    });

    if (len < 120) {
      checks.push({
        id: "desc-length",
        label: "Description length",
        status: "warn",
        message: `Too short (${len}/155). Aim for 120–155.`,
        weight: 10,
      });
    } else if (len > 155) {
      checks.push({
        id: "desc-length",
        label: "Description length",
        status: "warn",
        message: `Too long (${len}/155) — will be truncated`,
        weight: 10,
      });
    } else {
      checks.push({
        id: "desc-length",
        label: "Description length",
        status: "pass",
        message: `Good length (${len}/155)`,
        weight: 10,
      });
    }

    const nameInDesc = value.metaDescription
      .toLowerCase()
      .includes(ctx.name.toLowerCase());
    checks.push({
      id: "desc-has-name",
      label: "Category name in description",
      status: nameInDesc ? "pass" : "warn",
      message: nameInDesc
        ? "Category name appears in the description"
        : "Consider mentioning the category name",
      weight: 6,
    });
  }

  // ─── Slug ─────────────────────────────────────────
  if (ctx.slug.length > 60) {
    checks.push({
      id: "slug-length",
      label: "URL length",
      status: "warn",
      message: `Slug is ${ctx.slug.length} chars — keep under 60`,
      weight: 6,
    });
  } else if (ctx.slug.length > 0) {
    checks.push({
      id: "slug-length",
      label: "URL length",
      status: "pass",
      message: `Good length (${ctx.slug.length} chars)`,
      weight: 6,
    });
  }

  // ─── Category image ──────────────────────────────
  checks.push({
    id: "image-present",
    label: "Category image",
    status: ctx.imageUrl ? "pass" : "warn",
    message: ctx.imageUrl
      ? "Category has a display image"
      : "Add a category image for tiles and product grids",
    weight: 8,
  });

  // ─── OG image ─────────────────────────────────────
  const hasShareImage = !!(value.ogImage || ctx.imageUrl);
  checks.push({
    id: "og-image",
    label: "Social share image",
    status: hasShareImage ? "pass" : "warn",
    message: hasShareImage
      ? value.ogImage
        ? "Custom OG image set"
        : "Falls back to category image"
      : "Add an OG image or category image",
    weight: 6,
  });

  // ─── Content richness ────────────────────────────
  const descLen = ctx.description?.length ?? 0;
  if (descLen === 0) {
    checks.push({
      id: "content-richness",
      label: "Category description",
      status: "fail",
      message: "Add a description so the category page has content",
      weight: 10,
    });
  } else if (descLen < 50) {
    checks.push({
      id: "content-richness",
      label: "Category description",
      status: "warn",
      message: `Only ${descLen} chars. Aim for 100+ for better ranking.`,
      weight: 10,
    });
  } else {
    checks.push({
      id: "content-richness",
      label: "Category description",
      status: "pass",
      message: `${descLen} chars — good depth`,
      weight: 10,
    });
  }

  // ─── Products (empty category hint) ──────────────
  if (typeof ctx.productCount === "number") {
    if (ctx.productCount === 0) {
      checks.push({
        id: "products-present",
        label: "Products assigned",
        status: "warn",
        message: "This category has no products yet",
        weight: 6,
      });
    } else {
      checks.push({
        id: "products-present",
        label: "Products assigned",
        status: "pass",
        message: `${ctx.productCount} product${
          ctx.productCount === 1 ? "" : "s"
        } in this category`,
        weight: 6,
      });
    }
  }

  // ─── Score ────────────────────────────────────────
  let earned = 0;
  let possible = 0;
  for (const c of checks) {
    possible += c.weight;
    if (c.status === "pass") earned += c.weight;
    else if (c.status === "warn") earned += c.weight * 0.5;
  }
  const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;

  return { score, checks };
}

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function SeoTab({ value, onChange, context }: Props) {
  const [copied, setCopied] = useState<"title" | "desc" | null>(null);
  const [showAllChecks, setShowAllChecks] = useState(false);

  const analysis = useMemo(() => analyze(value, context), [value, context]);

  function generateAll() {
    onChange({
      metaTitle: genMetaTitle(context),
      metaDescription: genMetaDescription(context),
      ogImage: value.ogImage ?? null,
    });
  }

  function copy(text: string, which: "title" | "desc") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const serpTitle = value.metaTitle || context.name || "Category name";
  const serpDesc =
    value.metaDescription ||
    context.description ||
    "Browse our collection of baby products.";

  const scoreTone =
    analysis.score >= 80 ? "sage" : analysis.score >= 60 ? "yellow" : "pink";

  return (
    <div className="space-y-6">
      {/* ═══ Score banner ═══ */}
      <div
        className={cn(
          "rounded-2xl border-2 p-4 flex items-center gap-4",
          scoreTone === "sage"
            ? "border-sage-200 bg-sage-50"
            : scoreTone === "yellow"
            ? "border-yellow-200 bg-yellow-50"
            : "border-pink-200 bg-pink-50"
        )}
      >
        <ScoreRing score={analysis.score} tone={scoreTone} />

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-semibold",
              scoreTone === "sage"
                ? "text-sage-800"
                : scoreTone === "yellow"
                ? "text-yellow-800"
                : "text-pink-800"
            )}
          >
            {analysis.score >= 80
              ? "Excellent SEO"
              : analysis.score >= 60
              ? "Good — but can improve"
              : "Needs work"}
          </p>
          <p className="text-xs text-ink-600 mt-0.5">
            {analysis.checks.filter((c) => c.status === "pass").length} of{" "}
            {analysis.checks.length} checks passed
          </p>
        </div>

        <button
          type="button"
          onClick={generateAll}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <Wand2 className="h-4 w-4" />
          <span className="hidden sm:inline">Auto-generate</span>
          <span className="sm:hidden">Auto</span>
        </button>
      </div>

      {/* ═══ Meta title ═══ */}
      <MetaField
        label="Meta title"
        value={value.metaTitle}
        onChange={(v) => onChange({ metaTitle: v })}
        maxLength={60}
        placeholder={context.name || "Category meta title"}
        suggestion={genMetaTitle(context)}
        onUseSuggestion={() =>
          onChange({ metaTitle: genMetaTitle(context) })
        }
        onCopy={() => copy(value.metaTitle, "title")}
        copied={copied === "title"}
      />

      {/* ═══ Meta description ═══ */}
      <MetaField
        label="Meta description"
        value={value.metaDescription}
        onChange={(v) => onChange({ metaDescription: v })}
        maxLength={155}
        placeholder="Compelling description shown in search results"
        suggestion={genMetaDescription(context)}
        onUseSuggestion={() =>
          onChange({ metaDescription: genMetaDescription(context) })
        }
        onCopy={() => copy(value.metaDescription, "desc")}
        copied={copied === "desc"}
        textarea
      />

      {/* ═══ OG Image ═══ */}
      <div className="space-y-2">
        <ImagePicker
          label="Social share image (OG)"
          hint="Shown when this category is shared on Facebook, WhatsApp, or Twitter. Falls back to the category image if empty."
          value={value.ogImage}
          onChange={(url) => onChange({ ogImage: url })}
          aspect="banner"
          fallbackEmoji="📸"
        />
        {!value.ogImage && context.imageUrl && (
          <p className="text-[11px] text-blue-600 flex items-center gap-1.5">
            <Link2 className="h-3 w-3" />
            Currently using the category image as fallback
          </p>
        )}
      </div>

      {/* ═══ Previews ═══ */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold text-ink-800 flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-500" />
          Search previews
        </h3>

        <SerpPreview
          title={serpTitle}
          url={`babycentre.co.ke › categories › ${context.slug || "your-slug"}`}
          description={serpDesc}
        />

        <SocialCard
          icon={<Share2 className="h-3.5 w-3.5" />}
          label="Twitter / X"
          title={truncate(serpTitle, 70)}
          description={truncate(serpDesc, 200)}
          domain="babycentre.co.ke"
          hasImage={!!(value.ogImage || context.imageUrl)}
        />

        <SocialCard
          icon={<MessageCircle className="h-3.5 w-3.5" />}
          label="Facebook / WhatsApp"
          title={truncate(serpTitle, 88)}
          description={truncate(serpDesc, 200)}
          domain="babycentre.co.ke"
          hasImage={!!(value.ogImage || context.imageUrl)}
        />
      </div>

      {/* ═══ Analysis ═══ */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-800 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-pink-500" />
            SEO analysis
          </h3>
          {analysis.checks.filter((c) => c.status !== "pass").length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllChecks((v) => !v)}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              {showAllChecks ? "Show only issues" : "Show all checks"}
            </button>
          )}
        </div>

        <div className="rounded-2xl border-2 border-cream-300 bg-white divide-y divide-cream-200">
          {(showAllChecks
            ? analysis.checks
            : analysis.checks.filter((c) => c.status !== "pass")
          )
            .sort((a, b) => {
              const order = { fail: 0, warn: 1, pass: 2 };
              return order[a.status] - order[b.status];
            })
            .map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}

          {!showAllChecks &&
            analysis.checks.filter((c) => c.status !== "pass").length === 0 && (
              <div className="px-4 py-6 text-center">
                <div className="h-10 w-10 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-2">
                  <Check className="h-5 w-5 text-sage-600" />
                </div>
                <p className="text-sm font-medium text-sage-800">
                  All checks passing
                </p>
                <p className="text-xs text-ink-500 mt-1">
                  This category is well-optimized for search.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════

function ScoreRing({
  score,
  tone,
}: {
  score: number;
  tone: "sage" | "yellow" | "pink";
}) {
  const colors = {
    sage: { stroke: "#5C7D53", track: "#E1EBDE", text: "text-sage-700" },
    yellow: { stroke: "#D9A700", track: "#FFF4CC", text: "text-yellow-700" },
    pink: { stroke: "#D42A66", track: "#FFD9E7", text: "text-pink-700" },
  }[tone];

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={colors.track}
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-lg font-bold", colors.text)}>{score}</span>
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: Check }) {
  const config = {
    pass: {
      icon: Check,
      bg: "bg-sage-100",
      ic: "text-sage-600",
      tx: "text-sage-900",
    },
    warn: {
      icon: AlertTriangle,
      bg: "bg-yellow-100",
      ic: "text-yellow-600",
      tx: "text-yellow-900",
    },
    fail: {
      icon: X,
      bg: "bg-pink-100",
      ic: "text-pink-600",
      tx: "text-pink-900",
    },
  }[check.status];

  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div
        className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          config.bg
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", config.ic)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", config.tx)}>{check.label}</p>
        <p className="text-xs text-ink-600 mt-0.5">{check.message}</p>
      </div>
    </div>
  );
}

function MetaField({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  suggestion,
  onUseSuggestion,
  onCopy,
  copied,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder: string;
  suggestion: string;
  onUseSuggestion: () => void;
  onCopy: () => void;
  copied: boolean;
  textarea?: boolean;
}) {
  const len = value.length;
  const pct = len / maxLength;
  const tone =
    pct >= 1
      ? "text-pink-600"
      : pct >= 0.85
      ? "text-yellow-600"
      : len < 30
      ? "text-ink-400"
      : "text-sage-600";

  const showSuggestion = !value || value !== suggestion;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink-700">{label}</label>
        <div className="flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={onCopy}
              className="h-7 px-2 rounded-md text-[11px] font-medium text-ink-500 hover:text-ink-800 hover:bg-cream-100 flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-sage-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          )}
          <span className={cn("text-[10px] font-medium", tone)}>
            {len}/{maxLength}
          </span>
        </div>
      </div>

      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength + 20))}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-xl border-2 border-ink-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength + 20))}
          placeholder={placeholder}
          className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
      )}

      <div className="h-1 rounded-full bg-cream-200 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 1
              ? "bg-pink-500"
              : pct >= 0.85
              ? "bg-yellow-500"
              : len >= 30
              ? "bg-sage-500"
              : "bg-blue-400"
          )}
          style={{ width: `${Math.min(100, pct * 100)}%` }}
        />
      </div>

      {showSuggestion && suggestion && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            Suggested
          </div>
          <p className="text-xs text-ink-700 leading-relaxed line-clamp-2">
            {suggestion}
          </p>
          <button
            type="button"
            onClick={onUseSuggestion}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
          >
            <Check className="h-3 w-3" />
            Use this
          </button>
        </div>
      )}
    </div>
  );
}

function SerpPreview({
  title,
  url,
  description,
}: {
  title: string;
  url: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-cream-300 bg-white p-4">
      <div className="flex items-center gap-1.5 mb-3 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">
        <Search className="h-3.5 w-3.5" />
        Google (desktop)
      </div>

      <div className="flex items-center gap-2 mb-0.5">
        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
          B
        </div>
        <div>
          <div className="text-[11px] text-ink-800 leading-tight">
            BabyCentre
          </div>
          <div className="text-[10px] text-ink-500 leading-tight truncate">
            {url}
          </div>
        </div>
      </div>

      <p className="text-[15px] leading-snug text-blue-700 hover:underline cursor-pointer line-clamp-1 mt-1">
        {truncate(title, 60)}
      </p>
      <p className="text-[12px] text-ink-600 leading-snug line-clamp-2 mt-0.5">
        {truncate(description, 160)}
      </p>
    </div>
  );
}

function SocialCard({
  icon,
  label,
  title,
  description,
  domain,
  hasImage,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  domain: string;
  hasImage: boolean;
}) {
  return (
    <div className="rounded-xl border border-cream-300 bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 pt-3 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="p-4">
        <div className="aspect-[1.91/1] rounded-lg bg-gradient-to-br from-blue-100 via-cream-100 to-pink-100 flex items-center justify-center overflow-hidden">
          {hasImage ? (
            <div className="text-center">
              <div className="h-10 w-10 rounded-full bg-white shadow mx-auto flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-[10px] text-ink-500 mt-2">
                {domain} · og:image
              </p>
            </div>
          ) : (
            <p className="text-xs text-ink-400">No share image set</p>
          )}
        </div>

        <div className="mt-3">
          <p className="text-[10px] text-ink-500 uppercase tracking-wider truncate">
            {domain}
          </p>
          <p className="text-sm font-semibold text-ink-900 line-clamp-2 mt-0.5">
            {title}
          </p>
          <p className="text-xs text-ink-600 line-clamp-2 mt-0.5">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}