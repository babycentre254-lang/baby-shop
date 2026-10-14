"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Lock,
  Unlock,
  ExternalLink,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImagePicker } from "./image-picker";

export interface BrandBasicValue {
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  website: string;
  isActive: boolean;
}

interface Props {
  value: BrandBasicValue;
  onChange: (patch: Partial<BrandBasicValue>) => void;
}

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

export function BasicInfoTab({ value, onChange }: Props) {
  const [slugLocked, setSlugLocked] = useState(true);

  useEffect(() => {
    if (slugLocked && value.name) {
      const next = slugify(value.name);
      if (next !== value.slug) onChange({ slug: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.name, slugLocked]);

  return (
    <div className="space-y-6">
      <Section
        title="Brand identity"
        subtitle="Logo, name, and where customers can find them"
        icon={<Sparkles className="h-4 w-4 text-pink-500" />}
      >
        <div className="grid md:grid-cols-2 gap-5">
          <ImagePicker
            label="Brand logo"
            hint="Square or wide logo works best. PNG with transparency preferred."
            value={value.logoUrl}
            onChange={(url) => onChange({ logoUrl: url })}
            aspect="square"
            fallbackEmoji="🏷️"
          />

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">
                Brand name
                <span className="text-pink-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={value.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g. Carter's"
                maxLength={80}
                className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">
                Website (optional)
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="url"
                  value={value.website}
                  onChange={(e) => onChange({ website: e.target.value })}
                  placeholder="https://carters.com"
                  className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white pl-10 pr-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Details">
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
              placeholder="carters"
              className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white pl-3.5 pr-10 text-sm font-mono focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
            {value.slug && (
              <a
                href={`http://localhost:3000/products?brand=${value.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg text-ink-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <p className="text-xs text-ink-500 mt-1.5">
            URL:{" "}
            <code className="font-mono text-[11px]">
              babycentre.co.ke/brands/{value.slug || "your-slug"}
            </code>
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink-700">
            Description
          </label>
          <textarea
            value={value.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="A short introduction to this brand — what they make, where they're from, what they stand for."
            rows={4}
            maxLength={500}
            className="w-full rounded-xl border-2 border-ink-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-y"
          />
          <p className="text-xs text-ink-500 text-right">
            {value.description.length}/500
          </p>
        </div>
      </Section>

      <Section title="Visibility">
        <button
          type="button"
          onClick={() => onChange({ isActive: !value.isActive })}
          className={cn(
            "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors w-full",
            value.isActive
              ? "border-blue-400 bg-blue-50"
              : "border-cream-300 bg-white hover:border-blue-200"
          )}
        >
          <div
            className={cn(
              "mt-0.5 relative h-5 w-9 rounded-full transition-colors shrink-0",
              value.isActive ? "bg-blue-500" : "bg-ink-200"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                value.isActive ? "translate-x-[18px]" : "translate-x-0.5"
              )}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-900">Active</p>
            <p className="text-xs text-ink-500 mt-0.5">
              Visible to customers in brand filters and on product pages.
            </p>
          </div>
        </button>
      </Section>
    </div>
  );
}

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