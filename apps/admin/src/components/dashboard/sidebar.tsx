"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/session";
import { NAV_SECTIONS, type NavItem, type NavSection } from "./nav-config";
import { useSidebar } from "@/lib/stores/sidebar";
import { Tooltip } from "./tooltip";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { hasAdminPermission } from "@/lib/auth/permissions";

interface Props {
  user: SessionUser;
}

export function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const {
    collapsed,
    toggleCollapsed,
    mobileOpen,
    closeMobile,
    expandedSections,
    toggleSection,
    expandSection,
  } = useSidebar();

  const badges = useNavBadges(hasAdminPermission(user, "orders.view"));
  const visibleSections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            (item.href !== "/dashboard/staff" || user.role === "SUPER_ADMIN") &&
            (!item.permission || hasAdminPermission(user, item.permission))
        ),
      })).filter((section) => section.items.length > 0),
    [user.role, user.permissions]
  );

  // Auto-expand the section that contains the active route
  useEffect(() => {
    for (const section of visibleSections) {
      if (!section.label) continue; // top-level group always visible
      const hasActive = section.items.some((item) => isItemActive(item, pathname));
      if (hasActive) expandSection(section.id);
    }
  }, [pathname, expandSection, user]);

  // Close mobile drawer on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-ink-900/60 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen",
          "flex flex-col bg-ink-900 text-white",
          "border-r border-white/5",
          "transition-[width,transform] duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-64",
          // Mobile slide
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* ─── Brand header ─── */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-white/10 shrink-0",
            collapsed ? "justify-center px-3" : "justify-between px-4"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 min-w-0",
              collapsed && "justify-center"
            )}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
              B
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">BabyCentre</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">
                  Admin
                </p>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={closeMobile}
              className="md:hidden h-8 w-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ─── Nav ─── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 sidebar-scroll">
          {visibleSections.map((section) => (
            <Section
              key={section.id}
              section={section}
              pathname={pathname}
              collapsed={collapsed}
              expanded={expandedSections.includes(section.id)}
              onToggle={() => toggleSection(section.id)}
              badges={badges}
            />
          ))}
        </nav>

        {/* ─── Footer ─── */}
        <div className="border-t border-white/10 p-2 shrink-0">
          {/* Collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              "hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors",
              collapsed && "justify-center px-2"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="flex-1 text-left">Collapse</span>
              </>
            )}
          </button>

          {/* User card */}
          <div
            className={cn(
              "mt-1 rounded-xl bg-white/5 p-3",
              collapsed && "p-2 flex justify-center"
            )}
          >
            {collapsed ? (
              <Tooltip label={`${user.fullName} · ${user.role}`}>
                <div className="h-8 w-8 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                  {user.firstName.charAt(0).toUpperCase()}
                </div>
              </Tooltip>
            ) : (
              <>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                  Signed in as
                </p>
                <p className="text-sm font-medium text-white truncate">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-pink-400 uppercase tracking-wider mt-0.5">
                  {user.role.replace("_", " ")}
                </p>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Sections & Items
// ═══════════════════════════════════════════════════════════

function Section({
  section,
  pathname,
  collapsed,
  expanded,
  onToggle,
  badges,
}: {
  section: NavSection;
  pathname: string;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  badges: { orders: number; lowStock: number };
}) {
  const isTopLevel = !section.label;

  // No label → render items directly, no wrapper
  if (isTopLevel) {
    return (
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <Item
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            badges={badges}
          />
        ))}
      </div>
    );
  }

  // With label → collapsible
  const hasActive = section.items.some((item) =>
    isItemActive(item, pathname)
  );
  const showItems = expanded || collapsed;

  return (
    <div>
      {/* Section header */}
      {!collapsed ? (
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors",
            hasActive ? "text-pink-400" : "text-white/40 hover:text-white/70"
          )}
        >
          <span className="flex-1 text-left">{section.label}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </button>
      ) : (
        <div className="my-2 mx-3 border-t border-white/5" aria-hidden />
      )}

      {/* Items */}
      {showItems && (
        <div
          className={cn(
            "space-y-0.5 transition-all",
            !collapsed && "pl-1 ml-2 border-l border-white/5"
          )}
        >
          {section.items.map((item) => (
            <Item
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              badges={badges}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Item({
  item,
  pathname,
  collapsed,
  badges,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  badges: { orders: number; lowStock: number };
}) {
  const active = isItemActive(item, pathname);
  const Icon = item.icon;

  const badgeCount = item.badge ? badges[item.badge] : 0;
  const showBadge = item.badge && badgeCount > 0;

  const content = (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
        active
          ? "bg-gradient-to-r from-blue-500/20 to-pink-500/10 text-white font-medium border border-white/10"
          : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent",
        collapsed && "justify-center px-2"
      )}
      aria-current={active ? "page" : undefined}
    >
      <div className="relative shrink-0">
        <Icon
          className={cn(
            "h-[18px] w-[18px]",
            active
              ? "text-pink-400"
              : "text-white/50 group-hover:text-white/90"
          )}
        />
        {showBadge && collapsed && (
          <span
            className={cn(
              "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center",
              item.badge === "orders"
                ? "bg-pink-500 text-white"
                : "bg-yellow-500 text-ink-900"
            )}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </div>

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {showBadge && (
            <span
              className={cn(
                "min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center",
                item.badge === "orders"
                  ? "bg-pink-500 text-white"
                  : "bg-yellow-500 text-ink-900"
              )}
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
          {active && !showBadge && (
            <ChevronRight className="h-3.5 w-3.5 text-pink-400" />
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return <Tooltip label={item.label}>{content}</Tooltip>;
  }

  return content;
}

// ═══════════════════════════════════════════════════════════
// Helpers
//═══════════════════════════════════════════════════════════

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;

  // Special case: don't let /dashboard/products highlight when on /dashboard/products/new
  if (item.href === "/dashboard/products" && pathname === "/dashboard/products/new") {
    return false;
  }

  return pathname === item.href || pathname.startsWith(item.href + "/");
}
