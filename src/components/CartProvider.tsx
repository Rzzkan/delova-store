"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  key: string;
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  variantName?: string;
  image: string;
  price: number;
  qty: number;
  stock: number;
  shopeeUrl: string;
};

type Ctx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (i: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  ready: boolean;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "delova-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((i: Omit<CartItem, "key">) => {
    const key = `${i.productId}:${i.variantId ?? "-"}`;
    setItems((prev) => {
      const found = prev.find((p) => p.key === key);
      if (found) return prev.map((p) => (p.key === key ? { ...p, ...i, key, qty: Math.min(p.qty + i.qty, Math.max(i.stock, 1)) } : p));
      return [...prev, { ...i, key }];
    });
  }, []);
  const setQty = useCallback((key: string, qty: number) => setItems((p) => p.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(qty, Math.max(x.stock, 1))) } : x))), []);
  const remove = useCallback((key: string) => setItems((p) => p.filter((x) => x.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(
    () => ({
      items, ready, add, setQty, remove, clear,
      count: items.reduce((s, i) => s + i.qty, 0),
      total: items.reduce((s, i) => s + i.qty * i.price, 0),
    }),
    [items, ready, add, setQty, remove, clear],
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart harus di dalam CartProvider");
  return c;
}
