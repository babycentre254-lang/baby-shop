"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, ExternalLink, Menu } from "lucide-react";
import { adminLogoutAction } from "@/app/(auth)/actions";
import type { SessionUser } from "@/lib/auth/session";
import { useSidebar } from "@/lib/stores/sidebar";

export function Topbar({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { openMobile } = useSidebar();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    await adminLogoutAction();
  }

  return (
    <header className="h-16 bg-white border-b border-cream-200 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={openMobile}
          className="md:hidden p-2 -ml-2 text-ink-700 hover:bg-cream-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden md:block">
          <h1 className="text-sm text-ink-500">Admin Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="http://localhost:3000"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs text-ink-500 hover:text-blue-500 transition-colors px-3 py-2"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View store
        </Link>

        <button
          className="relative p-2 text-ink-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-pink-500" />
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-cream-100 transition-colors"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <div className="h-8 w-8 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
              {user.firstName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-ink-900 leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-ink-500">{user.email}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-56 rounded-2xl border-2 border-cream-300 bg-white shadow-xl overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-cream-200 bg-blue-50/50">
                <p className="text-sm font-semibold text-ink-900 truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-ink-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-pink-600 hover:bg-pink-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}