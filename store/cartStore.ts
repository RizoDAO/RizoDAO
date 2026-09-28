import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProductoCheckout = {
  id: string;
  nombre: string;
  marca: string;
  precioMXN: number;
  precioUSDC: number;
  imagen: string;
  tokens: number;
};

export type ResultadoPago = {
  txHash: string;
  txOnChain: boolean;
  producto: string;
  precioMXN: number;
  precioOriginal?: number;
  descuentoAplicado?: number;
  tokens: number;
  precioUSDC?: number;
};

export type CartItem = ProductoCheckout & { quantity: number };
export type CartInput = ProductoCheckout & { quantity?: number };

export function catalogToCart(product: {
  id: string; name: string; brandName: string; price: number;
  tokenPrice: number; imageUrl: string | null;
}): CartItem {
  return { id: product.id, nombre: product.name, marca: product.brandName,
    precioUSDC: product.price, precioMXN: Math.round(product.price * 19),
    imagen: product.imageUrl ?? "", tokens: product.tokenPrice, quantity: 1 };
}

function mergeItems(items: CartItem[], incoming: CartInput[]): CartItem[] {
  const merged = new Map(items.map(item => [item.id, item]));
  for (const item of incoming) {
    const quantity = item.quantity ?? 1;
    if (!Number.isSafeInteger(quantity) || quantity <= 0) continue;
    merged.set(item.id, { ...item, quantity: (merged.get(item.id)?.quantity ?? 0) + quantity });
  }
  return [...merged.values()];
}

interface CartState {
  items: CartItem[];
  pagoExitoso: ResultadoPago | null;
  addItem: (item: CartInput) => void;
  addItems: (items: CartInput[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setPagoExitoso: (resultado: ResultadoPago | null) => void;
}

export const useCartStore = create<CartState>()(
  persist((set) => ({
    items: [],
    pagoExitoso: null,
    addItem: (item) => set(state => ({ items: mergeItems(state.items, [item]) })),
    addItems: (items) => set(state => ({ items: mergeItems(state.items, items) })),
    removeItem: (id) => set(state => ({ items: state.items.filter(item => item.id !== id) })),
    updateQuantity: (id, quantity) => {
      if (!Number.isSafeInteger(quantity) || quantity < 0) return;
      set(state => ({ items: quantity === 0
        ? state.items.filter(item => item.id !== id)
        : state.items.map(item => item.id === id ? { ...item, quantity } : item) }));
    },
    clearCart: () => set({ items: [] }),
    setPagoExitoso: (resultado) => set({ pagoExitoso: resultado }),
  }), {
    name: "cart-storage",
    version: 1,
    migrate: (persisted) => {
      const old = persisted as { items?: CartItem[]; productoSeleccionado?: ProductoCheckout; pagoExitoso?: ResultadoPago };
      return { items: old.items ?? (old.productoSeleccionado ? [{ ...old.productoSeleccionado, quantity: 1 }] : []),
        pagoExitoso: old.pagoExitoso ?? null };
    },
    partialize: ({ items, pagoExitoso }) => ({ items, pagoExitoso }),
  })
);

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "cart-storage" || event.key === null) useCartStore.persist.rehydrate();
  });
}

export function useCart() {
  const store = useCartStore();
  return { ...store, clear: store.clearCart,
    count: store.items.reduce((sum, item) => sum + item.quantity, 0),
    total: store.items.reduce((sum, item) => sum + item.precioMXN * item.quantity, 0) };
}
