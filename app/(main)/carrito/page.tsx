"use client";
import { useCart } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

export default function CarritoPage() {
  const { items, removeItem, clear, total, count } = useCart();
  const router = useRouter();

  const totalTokens = items.reduce((s, i) => s + i.tokens * i.quantity, 0);

  if (count === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-4">
        <span className="text-5xl mb-4">🛒</span>
        <h2
          className="text-xl font-bold text-[#3E2723] mb-2"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Tu carrito está vacío
        </h2>
        <p className="text-sm text-[#A1887F] mb-6">
          Haz el quiz para descubrir tu rutina ideal
        </p>
        <button
          onClick={() => router.push("/quiz")}
          className="bg-[#8D6E63] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#6D4C41] transition-colors"
        >
          Hacer el quiz →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-lg mx-auto px-4 py-8">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#A1887F] hover:text-[#6D4C41] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex items-center justify-between mb-5">
          <h1
            className="text-2xl font-bold text-[#3E2723]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Carrito
          </h1>
          <button
            onClick={clear}
            className="text-xs text-[#A1887F] hover:text-red-500 transition-colors"
          >
            Vaciar todo
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#D7CCC8] p-4 flex gap-4"
            >
              <div className="w-16 h-16 rounded-xl bg-[#EFEBE9] overflow-hidden flex-shrink-0">
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%23EFEBE9'%3E%3Crect width='64' height='64'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24'%3E%F0%9F%A7%B4%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#A1887F]">{item.marca}</p>
                <p
                  className="text-sm font-semibold text-[#3E2723] line-clamp-2 mt-0.5"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {item.nombre}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span className="text-sm font-bold text-[#8D6E63]">
                      ${(item.precioMXN * item.quantity).toLocaleString("es-MX")} MXN
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-[#A1887F] ml-1">×{item.quantity}</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[#A1887F] hover:text-red-500 transition-colors"
                    aria-label="Quitar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-[#D7CCC8] p-5 space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#A1887F]">{count} producto{count !== 1 ? "s" : ""}</span>
            <span className="font-bold text-[#3E2723]">${total.toLocaleString("es-MX")} MXN</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#A1887F]">Tokens a ganar</span>
            <span className="font-semibold text-[#8D6E63]">🪙 +{totalTokens} puntos</span>
          </div>
        </div>

        <button
          onClick={() => {
            // Checkout handles one product at a time — for now go to tienda
            router.push("/tienda");
          }}
          className="w-full flex items-center justify-center gap-2 bg-[#8D6E63] text-white py-4 rounded-2xl text-base font-semibold hover:bg-[#6D4C41] transition-colors"
        >
          <ShoppingBag className="w-5 h-5" />
          Ir a la tienda a comprar
        </button>
        <p className="text-xs text-center text-[#A1887F] mt-3">
          Selecciona cada producto en la tienda para completar tu compra
        </p>
      </div>
    </div>
  );
}
