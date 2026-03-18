"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  id: number | string;
  cartItemKey?: string;
  name?: string;
  price?: number;
  quantity: number;
  // keep flexible for your product shape
  [key: string]: any;
};

const normalizeForKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getVariationValue = (item: Partial<CartItem>) =>
  item.variation ?? item.Variation ?? item.variation_name ?? item.variationName;

const getOriginValue = (item: Partial<CartItem>) =>
  item.origin ??
  item.Origin ??
  item.country ??
  item.Country ??
  item.country_of_origin ??
  item.Country_of_origin;

export const resolveCartItemKey = (item: Partial<CartItem>) => {
  if (item.cartItemKey) return item.cartItemKey;

  const baseId = String(item.id ?? "");
  const variation = normalizeForKey(getVariationValue(item));
  const origin = normalizeForKey(getOriginValue(item));

  return [baseId, variation, origin].join("::");
};

type CartContextValue = {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;

  // derived
  cartCount: number;
  getCartTotal: () => number;

  // cart helpers
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  addToCart: (item: CartItem) => void;
  updateQty: (id: CartItem["id"], qty: number, cartItemKey?: string) => void;
  updateQuantity: (id: CartItem["id"], qty: number, cartItemKey?: string) => void;
  removeItem: (id: CartItem["id"], cartItemKey?: string) => void;
  removeFromCart: (id: CartItem["id"], cartItemKey?: string) => void;
  clearCart: () => void;
  resolveCartItemKey: (item: Partial<CartItem>) => string;

  // OrderPanel (global)
  isOrderPanelOpen: boolean;
  setIsOrderPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openOrderPanel: () => void;
  closeOrderPanel: () => void;
  toggleOrderPanel: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // OrderPanel open state (global)
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cart]
  );
  const getCartTotal = useMemo(
    () => () => cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0),
    [cart]
  );

  const addItem = (item: Omit<CartItem, "quantity">, qty = 1) => {
    setCart((prev) => {
      const itemKey = resolveCartItemKey(item);
      const idx = prev.findIndex((x) => resolveCartItemKey(x) === itemKey);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: (copy[idx].quantity || 0) + qty };
        return copy;
      }
      const nextItem: CartItem = { id: item.id, ...item, cartItemKey: itemKey, quantity: qty };
      return [...prev, nextItem];
    });
  };
  const addToCart: CartContextValue["addToCart"] = (item) => {
    const { quantity, ...rest } = item;
    addItem(rest, quantity ?? 1);
  };

  const updateQty: CartContextValue["updateQty"] = (id, qty, cartItemKey) => {
    setCart((prev) => {
      const hasExplicitKey = Boolean(cartItemKey);
      if (qty <= 0) {
        return prev.filter((x) => {
          if (hasExplicitKey) return resolveCartItemKey(x) !== cartItemKey;
          return x.id !== id;
        });
      }

      return prev.map((x) => {
        if (hasExplicitKey) {
          return resolveCartItemKey(x) === cartItemKey ? { ...x, quantity: qty } : x;
        }
        return x.id === id ? { ...x, quantity: qty } : x;
      });
    });
  };
  const updateQuantity: CartContextValue["updateQuantity"] = (id, qty, cartItemKey) => {
    updateQty(id, qty, cartItemKey);
  };

  const removeItem: CartContextValue["removeItem"] = (id, cartItemKey) => {
    setCart((prev) =>
      prev.filter((x) => {
        if (cartItemKey) return resolveCartItemKey(x) !== cartItemKey;
        return x.id !== id;
      })
    );
  };
  const removeFromCart: CartContextValue["removeFromCart"] = (id, cartItemKey) => {
    removeItem(id, cartItemKey);
  };

  const clearCart = () => setCart([]);

  const openOrderPanel = () => setIsOrderPanelOpen(true);
  const closeOrderPanel = () => setIsOrderPanelOpen(false);
  const toggleOrderPanel = () => setIsOrderPanelOpen((v) => !v);

  const value: CartContextValue = {
    cart,
    setCart,
    cartCount,
    getCartTotal,
    addItem,
    addToCart,
    updateQty,
    updateQuantity,
    removeItem,
    removeFromCart,
    clearCart,
    resolveCartItemKey,

    isOrderPanelOpen,
    setIsOrderPanelOpen,
    openOrderPanel,
    closeOrderPanel,
    toggleOrderPanel,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
