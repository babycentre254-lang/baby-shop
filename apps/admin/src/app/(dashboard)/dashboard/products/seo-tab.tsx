"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  Wand2,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Copy,
  Lock,
  Unlock,
  TrendingUp,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
  FileText,
  Hash,
  Gauge,
  ExternalLink,
  MessageCircle,
  Info,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface SeoValue {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  weight: string;
  dimensions: string;
}

interface Props {
  value: SeoValue;
  onChange: (patch: Partial<SeoValue>) => void;
  // Context used for auto-generation and analysis
  context: {
    name: string;
    slug: string;
    description: string; // HTML
    shortDesc: string;
    categoryName: string;
    brandName: string;
    basePrice: number;
    salePrice: number | null;
    imageCount: number;
    imageAlts: string[]; // per-image altText
    ageRange: string;
    material: string;
    safetyCerts: string[];
  };
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trim() + "…";
}

function titleCase(str: string): string {
  return str
    .split(/\s+/)
    .map((w) => (w.length > 3 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function genMetaTitle(ctx: Props["context"]): string {
  const parts = [ctx.name];
  if (ctx.categoryName) parts.push(ctx.categoryName);
  if (ctx.brandName) parts.push(ctx.brandName);
  parts.push("BabyCentre");

  // Build from longest to shortest until it fits 60 chars
  let title = "";
  for (let i = 0; i < parts.length; i++) {
    const candidate = parts.slice(0, i + 1).join(" | ");
    if (candidate.length <= 60) {
      title = candidate;
    } else {
      break;
    }
  }
  if (!title) title = truncate(ctx.name + " | BabyCentre", 60);
  return title;
}

function genMetaDescription(ctx: Props["context"]): string {
  // Prefer the shortDesc if it's substantial
  const source = ctx.shortDesc || stripHtml(ctx.description);

  if (!source) {
    return truncate(
      `Shop ${ctx.name} at BabyCentre. ${
        ctx.categoryName ? `Part of our ${ctx.categoryName} range. ` : ""
      }Fast Nairobi delivery.`,
      155
    );
  }

  // Compose: intro + key benefits + CTA
  let desc = source;

  if (ctx.ageRange && !desc.toLowerCase().includes("age")) {
    desc = `${desc} Suitable for ${ctx.ageRange}.`;
  }

  if (ctx.safetyCerts.length > 0) {
    desc = `${desc} ${ctx.safetyCerts.slice(0, 2).join(", ")} certified.`;
  }

  if (desc.length < 120) {
    desc = `${desc} Free shipping over KSh 5,000. Same-day Nairobi delivery.`;
  }

  return truncate(desc, 155);
}

function suggestKeyword(ctx: Props["context"]): string {
  // Strip fillers
  const cleaned = ctx.name
    .toLowerCase()
    .replace(/\b(organic|premium|new|large|small|mini|the|and|for)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned.split(" ");
  if (parts.length > 3) return parts.slice(0, 3).join(" ");
  return cleaned;
}

function calculateKeywordDensity(text: string, keyword: string): number {
  if (!keyword) return 0;
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const kwWords = keyword.toLowerCase().split(/\s+/);
  let matches = 0;
  const joined = words.join(" ");
  const kwLower = kwWords.join(" ");
  let idx = joined.indexOf(kwLower);
  while (idx !== -1) {
    matches++;
    idx = joined.indexOf(kwLower, idx + 1);
  }
  return (matches / words.length) * 100;
}

// Flesch reading ease — approximates readability
function fleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter(Boolean);
  if (sentences.length === 0 || words.length === 0) return 0;

  let syllables = 0;
  for (const w of words) {
    syllables += countSyllables(w);
  }

  const score =
    206.835 -
    1.015 * (words.length / sentences.length) -
    84.6 * (syllables / words.length);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches?.length ?? 1);
}

// ═══════════════════════════════════════════════════════════
// Analysis engine
// ═══════════════════════════════════════════════════════════

interface Check {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
  weight: number; // for scoring
  fix?: () => void;
}

interface Analysis {
  score: number;
  checks: Check[];
}

function analyze(value: SeoValue, ctx: Props["context"]): Analysis {
  const checks: Check[] = [];
  const plainDesc = stripHtml(ctx.description);

  // ─── Title checks ────────────────────────────────────
  const titleLen = value.metaTitle.length;
  if (!value.metaTitle) {
    checks.push({
      id: "title-present",
      label: "Meta title present",
      status: "fail",
      message: "Add a meta title (ideally 30–60 characters)",
      weight: 12,
    });
  } else {
    checks.push({
      id: "title-present",
      label: "Meta title present",
      status: "pass",
      message: "Meta title is set",
      weight: 12,
    });

    if (titleLen < 30) {
      checks.push({
        id: "title-length",
        label: "Title length",
        status: "warn",
        message: `Too short (${titleLen}/60). Aim for 30–60.`,
        weight: 8,
      });
    } else if (titleLen > 60) {
      checks.push({
        id: "title-length",
        label: "Title length",
        status: "warn",
        message: `Too long (${titleLen}/60). Google may truncate.`,
        weight: 8,
      });
    } else {
      checks.push({
        id: "title-length",
        label: "Title length",
        status: "pass",
        message: `Good length (${titleLen}/60)`,
        weight: 8,
      });
    }

    if (value.focusKeyword) {
      const kwLower = value.focusKeyword.toLowerCase();
      const inTitle = value.metaTitle.toLowerCase().includes(kwLower);
      checks.push({
        id: "kw-in-title",
        label: "Keyword in title",
        status: inTitle ? "pass" : "warn",
        message: inTitle
          ? `"${value.focusKeyword}" appears in the title`
          : `Add "${value.focusKeyword}" to the title`,
        weight: 10,
      });
    }
  }

  // ─── Description checks ──────────────────────────────
  const descLen = value.metaDescription.length;
  if (!value.metaDescription) {
    checks.push({
      id: "desc-present",
      label: "Meta description present",
      status: "fail",
      message: "Add a meta description (ideally 120–155 characters)",
      weight: 12,
    });
  } else {
    checks.push({
      id: "desc-present",
      label: "Meta description present",
      status: "pass",
      message: "Meta description is set",
      weight: 12,
    });

    if (descLen < 120) {
      checks.push({
        id: "desc-length",
        label: "Description length",
        status: "warn",
        message: `Too short (${descLen}/155). Aim for 120–155.`,
        weight: 8,
      });
    } else if (descLen > 155) {
      checks.push({
        id: "desc-length",
        label: "Description length",
        status: "warn",
        message: `Too long (${descLen}/155). Google may truncate.`,
        weight: 8,
      });
    } else {
      checks.push({
        id: "desc-length",
        label: "Description length",
        status: "pass",
        message: `Good length (${descLen}/155)`,
        weight: 8,
      });
    }

    if (value.focusKeyword) {
      const inDesc = value.metaDescription
        .toLowerCase()
        .includes(value.focusKeyword.toLowerCase());
      checks.push({
        id: "kw-in-desc",
        label: "Keyword in description",
        status: inDesc ? "pass" : "warn",
        message: inDesc
          ? `"${value.focusKeyword}" appears in the description`
          : `Add "${value.focusKeyword}" to the description`,
        weight: 8,
      });
    }
  }

  // ─── Keyword checks ──────────────────────────────────
  if (value.focusKeyword) {
    const inSlug = ctx.slug.toLowerCase().includes(
      value.focusKeyword.toLowerCase().replace(/\s+/g, "-")
    );
    checks.push({
      id: "kw-in-slug",
      label: "Keyword in slug",
      status: inSlug ? "pass" : "warn",
      message: inSlug
        ? `"${value.focusKeyword}" appears in the URL`
        : `Add "${value.focusKeyword}" to the URL slug`,
      weight: 8,
    });

    const kwInH1 = ctx.name.toLowerCase().includes(value.focusKeyword.toLowerCase());
    checks.push({
      id: "kw-in-h1",
      label: "Keyword in product name",
      status: kwInH1 ? "pass" : "warn",
      message: kwInH1
        ? "Focus keyword appears in the product name"
        : "Consider including the keyword in the product name",
      weight: 6,
    });

    const density = calculateKeywordDensity(plainDesc, value.focusKeyword);
    if (density < 0.5) {
      checks.push({
        id: "kw-density",
        label: "Keyword density",
        status: "warn",
        message: `Low (${density.toFixed(1)}%). Aim for 0.5–2.5%.`,
        weight: 6,
      });
    } else if (density > 2.5) {
      checks.push({
        id: "kw-density",
        label: "Keyword density",
        status: "warn",
        message: `Too high (${density.toFixed(1)}%). Risk of keyword stuffing.`,
        weight: 6,
      });
    } else {
      checks.push({
        id: "kw-density",
        label: "Keyword density",
        status: "pass",
        message: `${density.toFixed(1)}% — within healthy range`,
        weight: 6,
      });
    }
  }

  // ─── Content checks ──────────────────────────────────
  const wordCount = plainDesc.split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) {
    checks.push({
      id: "content-length",
      label: "Content length",
      status: "warn",
      message: `Only ${wordCount} words. Aim for 300+ for better ranking.`,
      weight: 8,
    });
  } else if (wordCount < 300) {
    checks.push({
      id: "content-length",
      label: "Content length",
      status: "warn",
      message: `${wordCount} words. 300+ recommended.`,
      weight: 8,
    });
  } else {
    checks.push({
      id: "content-length",
      label: "Content length",
      status: "pass",
      message: `${wordCount} words — good depth`,
      weight: 8,
    });
  }

  // ─── Readability ─────────────────────────────────────
  if (plainDesc.length > 50) {
    const flesch = fleschReadingEase(plainDesc);
    if (flesch >= 60) {
      checks.push({
        id: "readability",
        label: "Readability",
        status: "pass",
        message: `Easy to read (score ${flesch}/100)`,
        weight: 6,
      });
    } else if (flesch >= 40) {
      checks.push({
        id: "readability",
        label: "Readability",
        status: "warn",
        message: `Moderately difficult (score ${flesch}/100)`,
        weight: 6,
      });
    } else {
      checks.push({
        id: "readability",
        label: "Readability",
        status: "warn",
        message: `Hard to read (score ${flesch}/100). Try shorter sentences.`,
        weight: 6,
      });
    }
  }

  // ─── Images ──────────────────────────────────────────
  checks.push({
    id: "images-present",
    label: "Product images",
    status: ctx.imageCount > 0 ? "pass" : "warn",
    message: ctx.imageCount > 0
      ? `${ctx.imageCount} image${ctx.imageCount === 1 ? "" : "s"} attached`
      : "Add at least one image",
    weight: 6,
  });

  if (ctx.imageCount > 0) {
    const missing = ctx.imageAlts.filter((a) => !a || a.trim().length < 3).length;
    checks.push({
      id: "image-alts",
      label: "Image alt text",
      status: missing === 0 ? "pass" : "warn",
      message: missing === 0
        ? "All images have alt text"
        : `${missing} image${missing === 1 ? "" : "s"} missing alt text`,
      weight: 6,
    });
  }

  // ─── Slug ────────────────────────────────────────────
  if (ctx.slug.length > 60) {
    checks.push({
      id: "slug-length",
      label: "URL length",
      status: "warn",
      message: `Slug is ${ctx.slug.length} chars. Keep it under 60.`,
      weight: 4,
    });
  } else if (ctx.slug.length > 0) {
    checks.push({
      id: "slug-length",
      label: "URL length",
      status: "pass",
      message: `Slug looks good (${ctx.slug.length} chars)`,
      weight: 4,
    });
  }

  // ─── Score ───────────────────────────────────────────
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
  const [keywordLocked, setKeywordLocked] = useState(false);
  const [copied, setCopied] = useState<"title" | "desc" | null>(null);
  const [showAllChecks, setShowAllChecks] = useState(false);

  // ─── Auto-generate focus keyword when name/category change ─
  useEffect(() => {
    if (keywordLocked) return;
    if (!context.name) return;
    const suggested = suggestKeyword(context);
    if (suggested && suggested !== value.focusKeyword) {
      onChange({ focusKeyword: suggested });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.name, context.categoryName, keywordLocked]);

  const analysis = useMemo(
    () => analyze(value, context),
    [value, context]
  );

  function generateAll() {
    onChange({
      metaTitle: genMetaTitle(context),
      metaDescription: genMetaDescription(context),
      focusKeyword: value.focusKeyword || suggestKeyword(context),
    });
  }

  function copy(text: string, which: "title" | "desc") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  // ─── SERP preview truncation ────────────────────────
  const serpTitle = value.metaTitle || context.name || "Product name";
  const serpDesc =
    value.metaDescription ||
    stripHtml(context.description).slice(0, 160) ||
    "Product description will appear here.";

  const scoreTone =
    analysis.score >= 80
      ? "sage"
      : analysis.score >= 60
      ? "yellow"
      : "pink";

  return (
    <div className="space-y-6">
      {/* ─── Score banner ─── */}
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

      {/* ─── Focus keyword ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink-700 flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-ink-400" />
            Focus keyword
          </label>
          <button
            type="button"
            onClick={() => setKeywordLocked((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors",
              keywordLocked
                ? "text-blue-600 bg-blue-50"
                : "text-ink-500 hover:text-ink-800 hover:bg-cream-100"
            )}
            title={keywordLocked ? "Keyword is locked" : "Auto-updates from product name"}
          >
            {keywordLocked ? (
              <>
                <Lock className="h-3 w-3" /> Locked
              </>
            ) : (
              <>
                <Unlock className="h-3 w-3" /> Auto
              </>
            )}
          </button>
        </div>
        <input
          type="text"
          value={value.focusKeyword}
          onChange={(e) => {
            setKeywordLocked(true);
            onChange({ focusKeyword: e.target.value });
          }}
          placeholder="e.g. organic onesie"
          className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
        <p className="text-xs text-ink-500">
          The primary phrase you want this product to rank for. We analyze the
          title, description, URL, and content against it.
        </p>
      </div>

      {/* ─── Meta title ─── */}
      <MetaField
        label="Meta title"
        value={value.metaTitle}
        onChange={(v) => onChange({ metaTitle: v })}
        maxLength={60}
        placeholder={context.name || "Product meta title"}
        suggestion={genMetaTitle(context)}
        onUseSuggestion={() => onChange({ metaTitle: genMetaTitle(context) })}
        onCopy={() => copy(value.metaTitle, "title")}
        copied={copied === "title"}
      />

      {/* ─── Meta description ─── */}
      <MetaField
        label="Meta description"
        value={value.metaDescription}
        onChange={(v) => onChange({ metaDescription: v })}
        maxLength={155}
        placeholder="A compelling description shown in search results"
        suggestion={genMetaDescription(context)}
        onUseSuggestion={() =>
          onChange({ metaDescription: genMetaDescription(context) })
        }
        onCopy={() => copy(value.metaDescription, "desc")}
        copied={copied === "desc"}
        textarea
      />

      {/* ─── Previews ─── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-ink-800 flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-500" />
          Search previews
        </h3>

        {/* Google desktop */}
        <SerpPreview
          icon={<Search className="h-3.5 w-3.5" />}
          label="Google (desktop)"
          title={serpTitle}
          url={`babycentre.co.ke › products › ${context.slug || "your-slug"}`}
          description={serpDesc}
        />

        {/* Twitter/X card */}
        <SocialCard
          icon={<MessageCircle className="h-3.5 w-3.5" />}
          label="Twitter / X"
          title={truncate(serpTitle, 70)}
          description={truncate(serpDesc, 200)}
          domain="babycentre.co.ke"
        />

        {/* Facebook OG */}
        <SocialCard
          icon={<Share2 className="h-3.5 w-3.5" />}
          label="Facebook / WhatsApp"
          title={truncate(serpTitle, 88)}
          description={truncate(serpDesc, 200)}
          domain="babycentre.co.ke"
        />
      </div>

      {/* ─── Analysis ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-800 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-pink-500" />
            SEO analysis
          </h3>
          {analysis.checks.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllChecks((v) => !v)}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              {showAllChecks
                ? "Show only issues"
                : `Show all ${analysis.checks.length}`}
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
                  Your product is well-optimized for search.
                </p>
              </div>
            )}
        </div>
      </div>

      {/* ─── Shipping (kept) ─── */}
      <div className="pt-4 border-t border-cream-200">
        <h3 className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          Shipping details
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <SimpleField
            label="Weight"
            value={value.weight}
            onChange={(v) => onChange({ weight: v })}
            placeholder="e.g. 250g"
          />
          <SimpleField
            label="Dimensions"
            value={value.dimensions}
            onChange={(v) => onChange({ dimensions: v })}
            placeholder="e.g. 30 × 20 × 5 cm"
          />
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
      iconColor: "text-sage-600",
      textColor: "text-sage-900",
    },
    warn: {
      icon: AlertTriangle,
      bg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-900",
    },
    fail: {
      icon: X,
      bg: "bg-pink-100",
      iconColor: "text-pink-600",
      textColor: "text-pink-900",
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
        <Icon className={cn("h-3.5 w-3.5", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", config.textColor)}>
          {check.label}
        </p>
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
  const counterTone =
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
          <span className={cn("text-[10px] font-medium", counterTone)}>
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

      {/* Length bar */}
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

      {/* Suggestion */}
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
  icon,
  label,
  title,
  url,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  url: string;
  description: string;
}) {
  const truncTitle = truncate(title, 60);
  const truncDesc = truncate(description, 160);

  return (
    <div className="rounded-xl border border-cream-300 bg-white p-4">
      <div className="flex items-center gap-1.5 mb-3 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">
        {icon}
        {label}
      </div>

      <div className="font-sans">
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
          {truncTitle}
        </p>
        <p className="text-[12px] text-ink-600 leading-snug line-clamp-2 mt-0.5">
          {truncDesc}
        </p>
      </div>
    </div>
  );
}

function SocialCard({
  icon,
  label,
  title,
  description,
  domain,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  domain: string;
}) {
  return (
    <div className="rounded-xl border border-cream-300 bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 pt-3 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="p-4">
        <div className="aspect-[1.91/1] rounded-lg bg-gradient-to-br from-blue-100 via-cream-100 to-pink-100 flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-white shadow mx-auto flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-[10px] text-ink-500 mt-2">
              {domain} · og:image
            </p>
          </div>
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

function SimpleField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}