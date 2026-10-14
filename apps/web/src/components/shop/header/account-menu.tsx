"use client";

import Link from "next/link";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  ChevronDown,
  Shield,
  Loader2,
} from "lucide-react";
import { authApi } from "@/lib/api/endpoints";
import type { SessionUser } from "@/lib/auth/session";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Props {
  user: SessionUser;
}

export function AccountMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  const router = useRouter();
  const queryClient = useQueryClient();

  const isAdmin =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  // Close on outside click
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

  // Close on Escape
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

  // Focus first item when opened
  useEffect(() => {
    if (open) {
      // Delay to ensure element is mounted
      requestAnimationFrame(() => firstItemRef.current?.focus());
    }
  }, [open]);

  // Keyboard nav inside menu
  const handleMenuKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!menuRef.current) return;

      const focusables = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        )
      );
      if (focusables.length === 0) return;

      const currentIndex = focusables.indexOf(
        document.activeElement as HTMLElement
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = focusables[(currentIndex + 1) % focusables.length];
        next?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev =
          focusables[
            (currentIndex - 1 + focusables.length) % focusables.length
          ];
        prev?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        focusables[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        focusables[focusables.length - 1]?.focus();
      } else if (e.key === "Tab") {
        // allow natural Tab, but close menu if focus leaves
        setTimeout(() => {
          if (
            menuRef.current &&
            !menuRef.current.contains(document.activeElement)
          ) {
            setOpen(false);
          }
        }, 0);
      }
    },
    []
  );

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      /* noop — still log out locally */
    }
    queryClient.clear();
    router.push("/");
    router.refresh();
  }

  const initial = user.firstName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      {/* ─── Trigger ─── */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 px-2 py-2",
          "text-ink-700 hover:text-blue-500 transition-colors group",
          "rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        )}
      >
        <div className="relative">
          <div
            className={cn(
              "h-6 w-6 md:h-7 md:w-7 rounded-full flex items-center justify-center",
              "text-white text-[11px] font-bold transition-transform",
              "bg-gradient-to-br from-blue-500 to-pink-500",
              "group-hover:scale-110"
            )}
          >
            {initial}
          </div>
          {/* Active dot */}
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-sage-500 border-2 border-white" />
        </div>
        <span className="hidden md:flex items-center gap-1 text-[11px] font-medium">
          {user.firstName}
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </span>
      </button>

      {/* ─── Menu ─── */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account menu"
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute right-0 top-full mt-2 z-50",
            "w-64 max-w-[calc(100vw-1.5rem)]",
            "rounded-2xl border border-cream-200 bg-white",
            "shadow-xl shadow-ink-900/5",
            "overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          {/* ─── Header ─── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-pink-50/50 border-b border-cream-200">
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-[11px] text-ink-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Role pill for admins */}
              {isAdmin && (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-pink-100 text-pink-700 text-[10px] font-semibold px-2 py-0.5">
                    <Shield className="h-2.5 w-2.5" />
                    {user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ─── Nav ─── */}
          <nav className="py-1.5">
            <MenuLink
              ref={firstItemRef}
              href="/account/orders"
              icon={<Package className="h-4 w-4" />}
              onNavigate={() => setOpen(false)}
            >
              My Orders
            </MenuLink>
            <MenuLink
              href="/account/addresses"
              icon={<MapPin className="h-4 w-4" />}
              onNavigate={() => setOpen(false)}
            >
              Addresses
            </MenuLink>
            <MenuLink
              href="/account/wishlist"
              icon={<Heart className="h-4 w-4" />}
              onNavigate={() => setOpen(false)}
            >
              Wishlist
            </MenuLink>
          </nav>

          {/* ─── Sign out ─── */}
          <div className="border-t border-cream-200 py-1.5 bg-cream-50/40">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm",
                "text-pink-600 hover:bg-pink-50 hover:text-pink-700",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "transition-colors"
              )}
              role="menuitem"
            >
              {loggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing out…
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MenuLink
// ═══════════════════════════════════════════════════════════

import { forwardRef } from "react";

interface MenuLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onNavigate: () => void;
}

const MenuLink = forwardRef<HTMLAnchorElement, MenuLinkProps>(
  ({ href, icon, children, onNavigate }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        onClick={onNavigate}
        role="menuitem"
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm",
          "text-ink-700 hover:bg-blue-50 hover:text-blue-600",
          "focus:outline-none focus:bg-blue-50 focus:text-blue-600",
          "transition-colors"
        )}
      >
        <span className="text-ink-400 transition-colors group-hover:text-blue-500">
          {icon}
        </span>
        {children}
      </Link>
    );
  }
);

MenuLink.displayName = "MenuLink";