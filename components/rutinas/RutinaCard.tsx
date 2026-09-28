"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, catalogToCart } from "@/store/cartStore";
import Link from "next/link";
import { Rutina } from "@/lib/rutinas";

interface Props {
  rutina: Rutina;
  isSuggested?: boolean;
}

const formatSlug = (slug: string) => 
  slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export default function RutinaCard({ rutina, isSuggested = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const buyRoutine = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error();
      const catalog: Parameters<typeof catalogToCart>[0][] = await response.json();
      const products = rutina.productSlugs.map(slug => catalog.find(product => product.id === slug));
      if (!products.length || products.some(product => !product)) {
        setError("Algunos productos de esta rutina no están disponibles.");
        return;
      }
      useCartStore.getState().addItems(products.map(product => catalogToCart(product!)));
      router.push("/carrito");
    } catch {
      setError("No se pudo cargar la rutina. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className={`bg-white rounded-3xl p-6 md:p-8 flex flex-col h-full transition-all ${
        isSuggested
          ? "border-2 border-[#8D6E63] shadow-md bg-[#FAF8F5]"
          : "border border-[#D7CCC8] shadow-sm hover:shadow-md"
      }`}
    >
      {isSuggested && (
        <div className="mb-4">
          <span className="inline-block bg-[#8D6E63] text-white text-xs font-bold px-3 py-1 rounded-full">
            ✨ Recomendada para ti
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <span
          className={`flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold flex-shrink-0 ${
            isSuggested ? "bg-white text-[#8D6E63]" : "bg-[#EFEBE9] text-[#6D4C41]"
          }`}
        >
          {rutina.curlPattern}
        </span>
        <h3
          className="text-xl md:text-2xl font-bold text-[#3E2723]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {rutina.name}
        </h3>
      </div>

      <p className="text-sm text-[#6D4C41] mb-6 flex-grow leading-relaxed">
        {rutina.description}
      </p>

      <div className="mb-6">
        <h4
          className="text-sm font-bold text-[#3E2723] mb-3"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Pasos de la rutina:
        </h4>
        <ol className="space-y-2 text-sm text-[#A1887F] list-decimal list-inside marker:text-[#8D6E63] marker:font-bold">
          {rutina.steps.map((step, idx) => (
            <li key={idx} className="leading-snug">
              <span className="ml-1 text-[#6D4C41]">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <button onClick={buyRoutine} disabled={loading}
        className="mb-4 rounded-xl bg-[#8D6E63] text-white py-3 font-semibold disabled:opacity-50">
        {loading ? "Cargando..." : "Comprar rutina completa"}
      </button>
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="mt-auto pt-5 border-t border-[#D7CCC8]">
        <h4
          className="text-sm font-bold text-[#3E2723] mb-3"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Productos sugeridos:
        </h4>
        <div className="flex flex-col gap-2">
          {rutina.productSlugs.map((slug) => (
            <Link
              key={slug}
              href={`/tienda`}
              className="group flex items-center justify-between bg-white border border-[#D7CCC8] p-3 rounded-xl hover:border-[#8D6E63] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-lg">
                  🧴
                </div>
                <span className="text-sm font-medium text-[#3E2723] group-hover:text-[#8D6E63] transition-colors">
                  {formatSlug(slug)}
                </span>
              </div>
              <span className="text-[#A1887F] group-hover:text-[#8D6E63] transition-colors">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
