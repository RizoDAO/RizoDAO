import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  nombre?: string;
  name?: string;
  marca?: string;
  imagen?: string;
  precioMXN?: number;
  precioUSDC?: number;
  price?: number;
  tokens?: number;
  quantity: number;
  [key: string]: unknown;
}

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

interface CartState {
  productoSeleccionado: ProductoCheckout | null;
  pagoExitoso: ResultadoPago | null;
  setProductoSeleccionado: (producto: ProductoCheckout | null) => void;
  setPagoExitoso: (resultado: ResultadoPago | null) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      productoSeleccionado: null,
      pagoExitoso: null,
      setProductoSeleccionado: (producto) => set({ productoSeleccionado: producto }),
      setPagoExitoso: (resultado) => set({ pagoExitoso: resultado }),
      clearCart: () => set({ productoSeleccionado: null }),
    }),
    {
      name: "cart-storage",
    }
  )
);

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "cart-storage") {
      useCartStore.persist.rehydrate();
    }
  });
}
/**
 * The live store plus the legacy field and method names this adapter bridges.
 * Older consumers still call `addItem`/`setProducto`/`limpiar`, so the adapter
 * has to be able to see them even though `CartState` no longer declares them.
 */
type AdaptableCartStore = CartState & {
  items?: CartItem[];
  producto?: CartItem;
  addItem?: (item: CartItem) => void;
  addItems?: (items: CartItem[]) => void;
  removeItem?: (id: string) => void;
  limpiar?: () => void;
  setProducto?: (item: CartItem) => void;
};

// Adapter para compatibilidad con componentes que importan { useCart }
export function useCart(): {
  items: CartItem[];
  count: number;
  addItem: (item: CartItem) => void;
  addItems: (items: CartItem[]) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  clear: () => void;
  total: number;
} {
  const store = useCartStore() as AdaptableCartStore;
  const items: CartItem[] =
    store?.items ?? (store?.producto ? [store.producto] : []);

  const clearFn = () => {
    if (typeof store?.clearCart === "function") {
      store.clearCart();
    } else if (typeof store?.limpiar === "function") {
      store.limpiar();
    }
  };

  return {
    items,
    count: items.reduce((acc: number, item: CartItem) => acc + (item?.quantity ?? 1), 0),
    addItem: (item: CartItem) => {
      if (typeof store?.addItem === "function") {
        store.addItem(item);
      } else if (typeof store?.setProducto === "function") {
        store.setProducto(item);
      }
    },
    addItems: (newItems: CartItem[]) => {
      if (typeof store?.addItems === "function") {
        store.addItems(newItems);
      } else {
        newItems.forEach((item) => {
          if (typeof store?.addItem === "function") {
            store.addItem(item);
          } else if (typeof store?.setProducto === "function") {
            store.setProducto(item);
          }
        });
      }
    },
    removeItem: (id: string) => {
      if (typeof store?.removeItem === "function") {
        store.removeItem(id);
      }
    },
    clearCart: clearFn,
    clear: clearFn,
    total: items.reduce((acc: number, item: CartItem) => {
      const price = item?.precioMXN ?? item?.precioUSDC ?? item?.price ?? 0;
      const qty = item?.quantity ?? 1;
      return acc + price * qty;
    }, 0),
  };
}