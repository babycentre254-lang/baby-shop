"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  expandedSections: string[];
  toggleCollapsed: () => void;
  setCollapsed: (v: boolean) => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleSection: (id: string) => void;
  expandSection: (id: string) => void;
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      expandedSections: ["catalog"],

      toggleCollapsed: () =>
        set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (v) => set({ collapsed: v }),

      openMobile: () => set({ mobileOpen: true }),
      closeMobile: () => set({ mobileOpen: false }),

      toggleSection: (id) =>
        set((s) => ({
          expandedSections: s.expandedSections.includes(id)
            ? s.expandedSections.filter((x) => x !== id)
            : [...s.expandedSections, id],
        })),

      expandSection: (id) =>
        set((s) =>
          s.expandedSections.includes(id)
            ? s
            : { expandedSections: [...s.expandedSections, id] }
        ),
    }),
    {
      name: "admin-sidebar",
      partialize: (state) => ({
        collapsed: state.collapsed,
        expandedSections: state.expandedSections,
      }),
    }
  )
);