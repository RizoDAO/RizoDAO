"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingCart, Check, ArrowLeft } from "lucide-react";
import { useCart } from "@/store/cartStore";

const MXN_PER_USDC = 19;

type Product = {
  id: string;
  name: string;
  brandName: string;
  price: number;
  tokenPrice: number;
  imageUrl: string | null;
  category: string | null;
  hairTypes: string | null;
  votes: number;
};

const HAIR_TYPE_LABELS: Record<string, string> = {
  "2a": "2A — Ondulado suave",
  "2b": "2B — Ondulado definido",
  "2c": "2C — Ondulado intenso",
  "3a": "3A — Rizado amplio",
  "3b": "3B — Rizado compacto",
  "3c": "3C — Muy rizado",
  "4a": "4A — Afro suave",
  "4b": "4B — Afro angular",
  "4c": "4C — Afro compacto",
};

function StepBadge({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#A1887F]">
      <div className="w-5 h-5 rounded-full bg-[#8D6E63] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
        {num}
      </div>
      <span>{label}</span>
    </div>
  );
}

export default function QuizResultadoPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { addItems, count } = useCart();

  const tipo = params.get("tipo") ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!tipo) return;
    setLoading(true);
    fetch(`/api/quiz/recommendations?hairType=${encodeURIComponent(tipo)}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tipo]);

  const handleAddRoutine = () => {
    if (products.length === 0) return;
    addItems(
      products.map((p) => ({
        id: p.id,
        nombre: p.name,
        marca: p.brandName,
        precioMXN: Math.round(p.price * MXN_PER_USDC),
        precioUSDC: p.price,
        imagen: p.imageUrl ?? "",
        tokens: p.tokenPrice,
      }))
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const totalMXN = products.reduce((s, p) => s + Math.round(p.price * MXN_PER_USDC), 0);
  const totalTokens = products.reduce((s, p) => s + p.tokenPrice, 0);
  const hairLabel = HAIR_TYPE_LABELS[tipo.toLowerCase()] ?? tipo.toUpperCase();

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back */}
        <button
          onClick={() => router.push("/quiz")}
          className="flex items-center gap-2 text-sm text-[#A1887F] hover:text-[#6D4C41] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cambiar tipo de rizo
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-[#A1887F] font-medium mb-1">Tu rutina para</p>
          <h1
            className="text-2xl font-bold text-[#3E2723] mb-1"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {hairLabel}
          </h1>
          <p className="text-sm text-[#A1887F]">
            Productos ordenados según tu rutina ideal — del más prioritario al complementario
          </p>
        </div>

        {/* Routine steps legend */}
        {!loading && products.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#D7CCC8] p-4 mb-5 flex flex-wrap gap-3">
            {products.map((p, i) => (
              <StepBadge key={p.id} num={i + 1} label={p.category ?? p.name} />
            ))}
          </div>
        )}

        {/* Product list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-[#D7CCC8] p-4 animate-pulse flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-[#EFEBE9] flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-[#EFEBE9] rounded w-16" />
                  <div className="h-4 bg-[#EFEBE9] rounded w-3/4" />
                  <div className="h-4 bg-[#EFEBE9] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-sm font-semibold text-[#3E2723]">Sin productos para este tipo</p>
            <p className="text-xs text-[#A1887F] mt-1">
              Pronto habrá más productos disponibles en el catálogo
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {products.map((p, i) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#D7CCC8] p-4 flex gap-4"
              >
                <div className="w-20 h-20 rounded-xl bg-[#EFEBE9] overflow-hidden flex-shrink-0">
                  <img
                    src={p.imageUrl ?? ""}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23EFEBE9'%3E%3Crect width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='28'%3E%F0%9F%A7%B4%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-[#A1887F]">{p.brandName}</p>
                      <h3
                        className="text-sm font-semibold text-[#3E2723] leading-snug mt-0.5 line-clamp-2"
                        style={{ fontFamily: "var(--font-playfair)" }}
                      >
                        {p.name}
                      </h3>
                    </div>
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EFEBE9] text-[#8D6E63] text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-sm font-bold text-[#8D6E63]">
                      ${Math.round(p.price * MXN_PER_USDC).toLocaleString("es-MX")} MXN
                    </span>
                    <span className="text-xs bg-[#EFEBE9] text-[#6D4C41] px-2 py-0.5 rounded-full">
                      🪙 +{p.tokenPrice} pts
                    </span>
                    {p.category && (
                      <span className="text-xs bg-[#FAF8F5] text-[#A1887F] border border-[#D7CCC8] px-2 py-0.5 rounded-full">
                        {p.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary + CTA */}
        {!loading && products.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#D7CCC8] p-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#A1887F]">{products.length} productos en la rutina</span>
              <span className="font-bold text-[#3E2723]">
                ${totalMXN.toLocaleString("es-MX")} MXN
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#A1887F]">
              <span>Tokens que ganarás</span>
              <span className="font-semibold text-[#8D6E63]">🪙 +{totalTokens} puntos</span>
            </div>

            <button
              onClick={handleAddRoutine}
              disabled={added}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold transition-all"
              style={{
                backgroundColor: added ? "#4CAF50" : "#8D6E63",
                color: "white",
              }}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  ¡Rutina agregada al carrito!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Agregar rutina completa al carrito
                </>
              )}
            </button>

            {added && (
              <button
                onClick={() => router.push("/carrito")}
                className="w-full text-center text-sm text-[#8D6E63] font-medium hover:underline"
              >
                Ver carrito ({count} producto{count !== 1 ? "s" : ""}) →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
