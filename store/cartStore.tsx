"use client";
import { createContext, useContext, useEffect, useReducer, ReactNode } from "react";

export type CartItem = {
  id: string;
  nombre: string;
  marca: string;
  precioMXN: number;
  precioUSDC: number;
  imagen: string;
  tokens: number;
  quantity: number;
};

type CartState = { items: CartItem[] };

type Action =
  | { type: "ADD_ITEMS"; items: Omit<CartItem, "quantity">[] }
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "CLEAR" }
  | { type: "LOAD"; items: CartItem[] };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "LOAD":
      return { items: action.items };
    case "ADD_ITEM": {
      const exists = state.items.find((i) => i.id === action.item.id);
      return {
        items: exists
          ? state.items.map((i) =>
              i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...state.items, { ...action.item, quantity: 1 }],
      };
    }
    case "ADD_ITEMS": {
      const merged = [...state.items];
      for (const item of action.items) {
        const idx = merged.findIndex((i) => i.id === item.id);
        if (idx >= 0) merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + 1 };
        else merged.push({ ...item, quantity: 1 });
      }
      return { items: merged };
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

const CartContext = createContext<{
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  addItems: (items: Omit<CartItem, "quantity">[]) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  total: number;
  count: number;
} | null>(null);

const STORAGE_KEY = "rizo_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: "LOAD", items: JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const total = state.items.reduce((s, i) => s + i.precioMXN * i.quantity, 0);
  const count = state.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem: (item) => dispatch({ type: "ADD_ITEM", item }),
        addItems: (items) => dispatch({ type: "ADD_ITEMS", items }),
        removeItem: (id) => dispatch({ type: "REMOVE_ITEM", id }),
        clear: () => dispatch({ type: "CLEAR" }),
        total,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
