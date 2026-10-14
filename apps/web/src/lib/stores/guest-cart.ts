"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GuestCartItem {
  id: string;
  variantId: string;
  productId: string;
  quantity: number;
  product: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
  };
  variant: {
    sku: string;
    size?: string;
    color?: string;
  };
  unitPrice: number;
  availableStock: number;
}

interface GuestCartState {
  items: GuestCartItem[];
  addItem: (item: Omit<GuestCartItem, "id">) => void;
  updateItem: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

export const useGuestCart = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (incoming) => {
        set((state) => {
          const existingIdx = state.items.findIndex(
            (it) => it.variantId === incoming.variantId
          );

          if (existingIdx >= 0) {
            const next = [...state.items];
            const merged = next[existingIdx].quantity + incoming.quantity;
            next[existingIdx] = {
              ...next[existingIdx],
              quantity: Math.min(merged, incoming.availableStock),
            };
            return { items: next };
          }

          return {
            items: [
              ...state.items,
              {
                ...incoming,
                id: `guest_${Date.now()}_${Math.random()
                  .toString(36)
                  .slice(2, 8)}`,
              },
            ],
          };
        });
      },

      updateItem: (id, quantity) => {
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id
              ? {
                  ...it,
                  quantity: Math.max(
                    1,
                    Math.min(quantity, it.availableStock)
                  ),
                }
              : it
          ),
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((it) => it.id !== id),
        }));
      },

      clear: () => set({ items: [] }),
    }),
    {
      name: "babycentre:guest-cart",
      version: 1,
    }
  )
);