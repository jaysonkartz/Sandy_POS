"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  id: number | string;
  name?: string;
  price?: number;
  quantity: number;
  // keep flexible for your product shape
  [key: string]: any;
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
  updateQty: (id: CartItem["id"], qty: number) => void;
  updateQuantity: (id: CartItem["id"], qty: number) => void;
  removeItem: (id: CartItem["id"]) => void;
  removeFromCart: (id: CartItem["id"]) => void;
  clearCart: () => void;

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
      const idx = prev.findIndex((x) => x.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: (copy[idx].quantity || 0) + qty };
        return copy;
      }
      const nextItem: CartItem = { id: item.id, ...item, quantity: qty };
      return [...prev, nextItem];
    });
  };
  const addToCart: CartContextValue["addToCart"] = (item) => {
    const { quantity, ...rest } = item;
    addItem(rest, quantity ?? 1);
  };

  const updateQty: CartContextValue["updateQty"] = (id, qty) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((x) => x.id !== id);
      return prev.map((x) => (x.id === id ? { ...x, quantity: qty } : x));
    });
  };
  const updateQuantity: CartContextValue["updateQuantity"] = (id, qty) => {
    updateQty(id, qty);
  };

  const removeItem: CartContextValue["removeItem"] = (id) => {
    setCart((prev) => prev.filter((x) => x.id !== id));
  };
  const removeFromCart: CartContextValue["removeFromCart"] = (id) => {
    removeItem(id);
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