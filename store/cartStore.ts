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
