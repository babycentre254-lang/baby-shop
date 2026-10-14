"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import {
  LayoutGrid,
  ChevronRight,
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export function AllCategoriesButton({
  categories,
}: {
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  // ─── Click outside ───
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onMouseDown);
      return () => document.removeEventListener("mousedown", onMouseDown);
    }
  }, [open]);

  // ─── Escape ───
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // ─── Focus first item when opened ───
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => firstItemRef.current?.focus());
    }
  }, [open]);

  // ─── Keyboard nav inside menu ───
  const onMenuKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!menuRef.current) return;
    const focusables = Array.from(
      menuRef.current.querySelectorAll<HTMLElement>("a[href]")
    );
    if (!focusables.length) return;

    const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusables[(currentIndex + 1) % focusables.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusables[(currentIndex - 1 + focusables.length) % focusables.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      focusables[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      focusables[focusables.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setTimeout(() => {
        if (menuRef.current && !menuRef.current.contains(document.activeElement)) {
          setOpen(false);
        }
      }, 0);
    }
  }, []);

  return (
    <div className="relative shrink-0">
      {/* ─── Trigger (icon-only) ─── */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Browse all categories"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "relative h-11 w-11 rounded-full flex items-center justify-center transition-all",
          "bg-pink-500 hover:bg-pink-600 text-white shadow-sm hover:shadow-md",
          "active:scale-95",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2",
          open && "bg-pink-600 shadow-md"
        )}
      >
        <LayoutGrid
          className={cn(
            "h-[18px] w-[18px] transition-transform duration-200",
            open && "rotate-90"
          )}
        />
        {/* Pulse dot when closed */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-white border-2 border-pink-500" />
        )}
      </button>

      {/* ─── Menu ─── */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Categories"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute left-0 top-full mt-2 z-50",
            "w-72 max-w-[calc(100vw-1.5rem)]",
            "rounded-2xl border border-cream-200 bg-white",
            "shadow-xl shadow-ink-900/5 overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-cream-200 bg-gradient-to-r from-pink-50 to-white">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-pink-100 text-pink-600 flex items-center justify-center">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-900 uppercase tracking-wider">
                  Shop by category
                </p>
                <p className="text-[10px] text-ink-500">
                  {categories.length} categor
                  {categories.length === 1 ? "y" : "ies"}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          {categories.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-ink-400">No categories yet</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto scroll-fade">
              {categories.map((cat, idx) => (
                <Link
                  key={cat._id}
                  ref={idx === 0 ? firstItemRef : undefined}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className={cn(
                    "group flex items-center gap-3 px-4 py-2.5",
                    "text-sm text-ink-700",
                    "hover:bg-pink-50 hover:text-pink-600",
                    "focus:outline-none focus:bg-pink-50 focus:text-pink-600",
                    "transition-colors"
                  )}
                >
                  <span className="h-7 w-7 rounded-md bg-cream-100 text-ink-500 flex items-center justify-center shrink-0 group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">
                    <span className="text-[10px] font-bold">
                      {cat.name.charAt(0).toUpperCase()}
                    </span>
                  </span>
                  <span className="flex-1 truncate">{cat.name}</span>
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-ink-300",
                      "group-hover:text-pink-500 group-hover:translate-x-0.5",
                      "transition-all"
                    )}
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Footer — view all */}
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            role="menuitem"
            className={cn(
              "flex items-center justify-center gap-1.5 px-4 py-3",
              "border-t border-cream-200 bg-cream-50/50",
              "text-xs font-semibold text-pink-600 hover:text-pink-700 hover:bg-pink-50",
              "focus:outline-none focus:bg-pink-50 focus:text-pink-700",
              "transition-colors"
            )}
          >
            View all products
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}