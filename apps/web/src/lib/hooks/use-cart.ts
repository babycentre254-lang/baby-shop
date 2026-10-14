"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { cartApi } from "@/lib/api/endpoints";
import { useGuestCart } from "@/lib/stores/guest-cart";
import { useSession } from "@/lib/hooks/use-session";

export interface CartLineItem {
  id: string;
  variantId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
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
}

export interface CartData {
  items: CartLineItem[];
  subtotal: number;
  itemCount: number;
  totalWeightGrams: number;
}

export interface AddItemInput {
  variantId: string;
  quantity?: number;
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

export function useCart() {
  const qc = useQueryClient();
  const { user, isLoading: sessionLoading } = useSession();
  const isAuthenticated = !!user;

  // Always-latest ref so mutations don't close over stale values
  const isAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const guestCart = useGuestCart();

  const serverCartQ = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.get(),
    enabled: isAuthenticated,
    staleTime: 10_000,
    retry: false,
  });

  // ─── Merge guest cart into server on login ───
  const [mergedForUser, setMergedForUser] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (mergedForUser === user._id) return;

    const guestItems = useGuestCart.getState().items;
    if (guestItems.length === 0) {
      setMergedForUser(user._id);
      return;
    }

    cartApi
      .merge(
        guestItems.map((it) => ({
          variantId: it.variantId,
          quantity: it.quantity,
        }))
      )
      .then(() => {
        useGuestCart.getState().clear();
        qc.invalidateQueries({ queryKey: ["cart"] });
      })
      .catch((err) => {
        console.error("[cart merge] failed:", err);
      })
      .finally(() => {
        setMergedForUser(user._id);
      });
  }, [isAuthenticated, user, mergedForUser, qc]);

  const serverCart = serverCartQ.data?.cart;

  const cart: CartData | null = isAuthenticated
    ? serverCart
      ? {
          items: serverCart.items.map((it: any) => ({
            id: it._id,
            variantId: it.variantId,
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
            availableStock: it.availableStock,
            product: it.product,
            variant: it.variant,
          })),
          subtotal: serverCart.subtotal,
          itemCount: serverCart.itemCount,
          totalWeightGrams: serverCart.totalWeightGrams ?? 0,
        }
      : null
    : {
        items: guestCart.items.map((it) => ({
          id: it.id,
          variantId: it.variantId,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          lineTotal: it.unitPrice * it.quantity,
          availableStock: it.availableStock,
          product: it.product,
          variant: it.variant,
        })),
        subtotal: guestCart.items.reduce(
          (sum, it) => sum + it.quantity * it.unitPrice,
          0
        ),
        itemCount: guestCart.items.reduce(
          (sum, it) => sum + it.quantity,
          0
        ),
        totalWeightGrams: 0,
      };

  // ═══════════════════════════════════════════════════════════
  // Mutations — each checks the LATEST auth state via isAuthRef
  // ═══════════════════════════════════════════════════════════

  const addMutation = useMutation({
    mutationFn: async (input: AddItemInput) => {
      const quantity = input.quantity ?? 1;

      // Use the LATEST auth state, not the closed-over one
      if (isAuthRef.current) {
        try {
          return await cartApi.addItem(input.variantId, quantity);
        } catch (err: any) {
          // If the server rejects us (expired token), fall back to guest cart
          if (err?.status === 401) {
            isAuthRef.current = false;
            qc.invalidateQueries({ queryKey: ["session"] });
          } else {
            throw err;
          }
        }
      }

      guestCart.addItem({
        variantId: input.variantId,
        productId: input.product._id,
        quantity,
        product: input.product,
        variant: input.variant,
        unitPrice: input.unitPrice,
        availableStock: input.availableStock,
      });
      return null;
    },
    onSuccess: () => {
      if (isAuthRef.current) qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; quantity: number }) => {
      if (isAuthRef.current) {
        return cartApi.updateItem(payload.id, payload.quantity);
      }
      guestCart.updateItem(payload.id, payload.quantity);
      return null;
    },
    onSuccess: () => {
      if (isAuthRef.current) qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isAuthRef.current) {
        return cartApi.removeItem(id);
      }
      guestCart.removeItem(id);
      return null;
    },
    onSuccess: () => {
      if (isAuthRef.current) qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (isAuthRef.current) {
        return cartApi.clear();
      }
      guestCart.clear();
      return null;
    },
    onSuccess: () => {
      if (isAuthRef.current) qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  return {
    cart,
    isLoading: isAuthenticated ? serverCartQ.isLoading : sessionLoading,
    isError: isAuthenticated ? serverCartQ.isError : false,
    refetch: serverCartQ.refetch,
    isAuthenticated,

    addItem: (input: AddItemInput) => addMutation.mutateAsync(input),
    updateItem: (id: string, quantity: number) =>
      updateMutation.mutateAsync({ id, quantity }),
    removeItem: (id: string) => removeMutation.mutateAsync(id),
    clearCart: () => clearMutation.mutateAsync(),

    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
