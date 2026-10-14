"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Grid3x3 } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
}

const MAX_VISIBLE = 6;

export function CategoriesNav({ categories }: Props) {
  const pathname = usePathname();
  const visible = categories.slice(0, MAX_VISIBLE);
  const overflow = categories.slice(MAX_VISIBLE);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      <NavLink href="/" active={pathname === "/"}>
        Home
      </NavLink>

      {visible.map((cat) => {
        const href = `/products?category=${cat.slug}`;
        const active = false; // pathname is always /products so we don't highlight
        return (
          <NavLink key={cat._id} href={href} active={active}>
            {cat.name}
          </NavLink>
        );
      })}

      {overflow.length > 0 && <MoreDropdown items={overflow} />}
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative shrink-0 px-3 md:px-4 py-3 text-sm font-medium transition-colors",
        "text-ink-700 hover:text-pink-500",
        active && "text-pink-500"
      )}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-pink-500 rounded-full" />
      )}
    </Link>
  );
}

function MoreDropdown({ items }: { items: Category[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-3 md:px-4 py-3 text-sm font-medium text-ink-700 hover:text-pink-500 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        More
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 w-56 rounded-2xl border-2 border-cream-300 bg-white shadow-xl overflow-hidden z-50"
        >
          {items.map((cat) => (
            <Link
              key={cat._id}
              href={`/products?category=${cat.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
