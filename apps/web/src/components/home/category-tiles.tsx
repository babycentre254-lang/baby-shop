import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

interface Props {
  categories: Category[];
}

const FALLBACK_EMOJI: Record<string, string> = {
  clothing: "👶",
  toys: "🧸",
  feeding: "🍼",
  bath: "🛁",
  nursery: "🛏️",
  diapers: "🧷",
};

export function CategoryTiles({ categories }: Props) {
  if (!categories.length) return null;

  const visible = categories.slice(0, 8);

  return (
    <section id="shop-categories" className="scroll-mt-24 border-b border-cream-100 bg-white py-5 md:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div>
            <p className="text-[10px] font-medium text-ink-500">Find just what you need</p>
            <h2 className="mt-0.5 font-display text-lg font-semibold leading-tight text-ink-900 sm:text-xl">
              Shop by category
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-cream-300 px-3 text-xs font-semibold text-ink-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 sm:pb-0 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((category) => (
            <CategoryTile key={category._id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ category }: { category: Category }) {
  const emoji = FALLBACK_EMOJI[category.slug] ?? "🎁";

  return (
    <Link
      href={`/products?category=${category.slug}`}
      className={cn(
        "group flex min-h-[68px] w-[172px] shrink-0 snap-start items-center gap-3 rounded-xl border border-cream-200 bg-white p-2.5 transition-colors",
        "hover:border-blue-200 hover:bg-blue-50/40 sm:w-auto",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-50 transition-colors group-hover:bg-blue-50">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt=""
            width={44}
            height={44}
            className="h-9 w-9 object-contain"
          />
        ) : (
          <span className="text-xl leading-none" aria-hidden="true">{emoji}</span>
        )}
      </span>
      <span className="min-w-0 flex-1 text-xs font-medium leading-snug text-ink-800 line-clamp-2 transition-colors group-hover:text-blue-700">
        {category.name}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
    </Link>
  );
}
