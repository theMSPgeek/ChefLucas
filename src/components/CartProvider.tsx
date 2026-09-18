"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getProduct,
  rememberProducts,
  stockStatus,
  type Product,
} from "@/lib/products";

export type CartLine = { id: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (id: string, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  hydrateCatalogue: (products: Product[]) => void;
  detailed: { product: Product; quantity: number }[];
  subtotal: number;
};

const STORAGE_KEY = "cheflucas-sauce-cart";
const listeners = new Set<() => void>();
const emptyLines: CartLine[] = [];
let snapshot: CartLine[] = emptyLines;
let snapshotKey = "[]";
let drawerOpen = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function parse(raw: string | null): CartLine[] {
  if (!raw) return emptyLines;
  try {
    const next = JSON.parse(raw) as CartLine[];
    return Array.isArray(next) ? next : emptyLines;
  } catch {
    return emptyLines;
  }
}

function persist(next: CartLine[]) {
  const key = JSON.stringify(next);
  snapshot = next;
  snapshotKey = key;
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* ignore quota */
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => emit();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  try {
    const key = localStorage.getItem(STORAGE_KEY) || "[]";
    if (key !== snapshotKey) {
      snapshotKey = key;
      snapshot = parse(key);
    }
  } catch {
    /* ignore */
  }
  return snapshot;
}

function getServerSnapshot() {
  return emptyLines;
}

function getOpenSnapshot() {
  return drawerOpen;
}

function getOpenServerSnapshot() {
  return false;
}

function maxQuantity(product: Product) {
  if (!product.trackInventory || product.qty === null) return Infinity;
  return Math.max(0, product.qty);
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const open = useSyncExternalStore(
    subscribe,
    getOpenSnapshot,
    getOpenServerSnapshot,
  );
  const [catalogue, setCatalogue] = useState<Product[]>([]);

  const hydrateCatalogue = useCallback((products: Product[]) => {
    rememberProducts(products);
    setCatalogue(products);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shop/products")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.products)) hydrateCatalogue(data.products);
      })
      .catch(() => {
        /* catalogue stays empty; shop page hydrates on visit */
      });
    return () => {
      cancelled = true;
    };
  }, [hydrateCatalogue]);

  const setOpen = useCallback((value: boolean) => {
    drawerOpen = value;
    emit();
  }, []);

  const add = useCallback((id: string, quantity = 1) => {
    const product = getProduct(id);
    if (!product || stockStatus(product) === "sold-out") return;
    const cap = maxQuantity(product);
    const current = getSnapshot();
    const existing = current.find((line) => line.id === id);
    const nextQty = Math.min(cap, (existing?.quantity || 0) + quantity);
    if (nextQty < 1) return;
    persist(
      existing
        ? current.map((line) =>
            line.id === id ? { ...line, quantity: nextQty } : line,
          )
        : [...current, { id, quantity: nextQty }],
    );
    drawerOpen = true;
    emit();
  }, []);

  const remove = useCallback((id: string) => {
    persist(getSnapshot().filter((line) => line.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const product = getProduct(id);
    const cap = product ? maxQuantity(product) : quantity;
    const nextQty = Math.min(cap, quantity);
    const current = getSnapshot();
    persist(
      nextQty < 1
        ? current.filter((line) => line.id !== id)
        : current.map((line) => (line.id === id ? { ...line, quantity: nextQty } : line)),
    );
  }, []);

  const clear = useCallback(() => persist([]), []);

  const detailed = useMemo(
    () =>
      lines
        .map((line) => {
          const product =
            catalogue.find((item) => item.id === line.id) || getProduct(line.id);
          return product ? { product, quantity: line.quantity } : null;
        })
        .filter((line): line is { product: Product; quantity: number } => Boolean(line)),
    [lines, catalogue],
  );

  const subtotal = detailed.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const count = detailed.reduce((sum, line) => sum + line.quantity, 0);

  const value = useMemo(
    () => ({
      lines,
      count,
      open,
      setOpen,
      add,
      remove,
      setQuantity,
      clear,
      hydrateCatalogue,
      detailed,
      subtotal,
    }),
    [lines, count, open, setOpen, add, remove, setQuantity, clear, hydrateCatalogue, detailed, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
