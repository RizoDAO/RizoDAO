"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAccesly } from "accesly";
import { Search, TrendingUp, Sparkles } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

const NEXT_MILESTONE = 500;
const MXN_PER_USDC = 19;

type ProductoCheckout = {
  id: string;
  nombre: string;
  marca: string;
  precioMXN: number;
  precioUSDC: number;
  imagen: string;
  tokens: number;
};

type ProductoDB = {
  id: string;
  name: string;
  brandName: string;
  price: number;
  tokenPrice: number;
  imageUrl: string | null;
  category: string | null;
  votes: number;
};

function dbToUI(p: ProductoDB): ProductoCheckout & { tendencia: boolean; votes: number } {
  return {
    id: p.id,
    nombre: p.name,
    marca: p.brandName,
    precioUSDC: p.price,
    precioMXN: Math.round(p.price * MXN_PER_USDC),
    imagen: p.imageUrl ?? "",
    tokens: p.tokenPrice,
    votes: p.votes,
    tendencia: false,
  };
}

function TarjetaProducto({
  producto,
  onClick,
}: {
  producto: ProductoCheckout;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-[#D7CCC8] shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="aspect-square bg-[#EFEBE9] overflow-hidden">
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='%23EFEBE9'%3E%3Crect width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='40'%3E%F0%9F%A7%B4%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>
      <div className="p-4 space-y-2">
        <div>
          <p className="text-xs text-[#A1887F]">{producto.marca}</p>
          <h4
            className="text-sm font-semibold text-[#3E2723] leading-snug line-clamp-2 mt-0.5"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {producto.nombre}
          </h4>
        </div>
        <p className="text-lg font-bold text-[#8D6E63]">
          ${producto.precioMXN.toLocaleString("es-MX")} MXN
        </p>
        <div className="inline-flex items-center gap-1 bg-[#EFEBE9] text-[#6D4C41] text-xs font-medium px-2.5 py-1 rounded-full">
          🪙 +{producto.tokens} puntos
        </div>
      </div>
    </div>
  );
}

export default function TiendaPage() {
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState<(ProductoCheckout & { tendencia: boolean; votes: number })[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [puntos, setPuntos] = useState<number | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const { wallet } = useAccesly();

  const userEmail = session?.user?.email || wallet?.email;

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: ProductoDB[]) => {
        const mapped = data.map(dbToUI);
        const sorted = [...mapped].sort((a, b) => b.votes - a.votes);
        const topIds = new Set(sorted.slice(0, 3).map((p) => p.id));
        setProductos(mapped.map((p) => ({ ...p, tendencia: topIds.has(p.id) })));
      })
      .catch(() => {})
      .finally(() => setLoadingProductos(false));
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/user/me?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => { if (typeof data.tokens === "number") setPuntos(data.tokens); })
      .catch(() => {});
  }, [userEmail]);

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  const tendencias = productos.filter((p) => p.tendencia);

  const setProductoSeleccionado = useCartStore((state) => state.setProductoSeleccionado);

  const handleProductoClick = (producto: ProductoCheckout) => {
    setProductoSeleccionado(producto);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl md:text-3xl font-bold text-[#3E2723] mb-1"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Tienda
          </h1>
          <p className="text-[#A1887F] mb-5">
            Productos de Rizos Mexicanos recomendados por la comunidad
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1887F]" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D7CCC8] bg-white text-sm text-[#3E2723] placeholder:text-[#BCAAA4] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Contenido principal */}
          <div className="lg:col-span-9 space-y-6">

            {/* Banner */}
            <div className="bg-gradient-to-r from-[#8D6E63] to-[#BCAAA4] text-white px-6 py-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6" />
                <h3
                  className="text-lg font-semibold"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Compra y gana puntos RIZO
                </h3>
              </div>
              <p className="text-sm opacity-90">
                Cada compra te da puntos que puedes canjear por descuentos.
                Apoya marcas mexicanas y cuida tu cabello rizado.
              </p>
            </div>

            {/* Skeleton de carga */}
            {loadingProductos && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-[#D7CCC8] animate-pulse">
                    <div className="aspect-square bg-[#EFEBE9]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-[#EFEBE9] rounded w-20" />
                      <div className="h-4 bg-[#EFEBE9] rounded w-full" />
                      <div className="h-4 bg-[#EFEBE9] rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingProductos && (
              <>
                {/* Tendencias */}
                {!busqueda && tendencias.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-[#8D6E63]" />
                      <h3
                        className="text-lg font-semibold text-[#3E2723]"
                        style={{ fontFamily: "var(--font-playfair)" }}
                      >
                        Tendencias de la comunidad
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {tendencias.map((p) => (
                        <div key={p.id} className="relative">
                          <span className="absolute top-3 left-3 z-10 bg-[#8D6E63] text-white text-xs font-medium px-2 py-0.5 rounded-full">
                            Tendencia 🔥
                          </span>
                          <TarjetaProducto producto={p} onClick={() => handleProductoClick(p)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Todos los productos */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-lg font-semibold text-[#3E2723]"
                      style={{ fontFamily: "var(--font-playfair)" }}
                    >
                      {busqueda ? "Resultados de busqueda" : "Todos los productos"}
                    </h3>
                    <p className="text-sm text-[#A1887F]">
                      {filtrados.length} {filtrados.length === 1 ? "producto" : "productos"}
                    </p>
                  </div>

                  {filtrados.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {filtrados.map((p) => (
                        <TarjetaProducto key={p.id} producto={p} onClick={() => handleProductoClick(p)} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <span className="text-4xl mb-3">🔍</span>
                      <p className="text-sm font-semibold text-[#3E2723]">Sin resultados</p>
                      <p className="text-xs text-[#A1887F] mt-1">Intenta con otro termino</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-3 space-y-4">

            {/* Marca destacada */}
            <div className="bg-white rounded-2xl border border-[#D7CCC8] p-5">
              <h3
                className="text-base font-semibold text-[#3E2723] mb-4"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Marca destacada
              </h3>
              <div className="flex flex-col gap-2">
                <div className="w-full px-4 py-3 bg-[#FAF8F5] rounded-xl">
                  <p className="text-sm font-medium text-[#3E2723]">Rizos Mexicanos</p>
                  <p className="text-xs text-[#A1887F] mt-0.5">{productos.length} productos disponibles</p>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div className="bg-gradient-to-br from-[#EFEBE9] to-[#D7CCC8] rounded-2xl p-5 border border-[#BCAAA4]">
              <h4
                className="text-sm font-semibold text-[#3E2723] mb-2"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                💡 ¿Sabías que?
              </h4>
              <p className="text-xs text-[#6D4C41] leading-relaxed">
                Cada compra apoya a una marca mexicana. Ganas puntos para descuentos futuros.
              </p>
            </div>

            {/* Balance de puntos */}
            <div className="bg-white rounded-2xl border border-[#D7CCC8] p-5">
              <p className="text-xs text-[#A1887F] mb-1">Mis puntos RIZO</p>
              <div className="flex items-end gap-1.5">
                <span
                  className="text-3xl font-bold text-[#8D6E63]"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {puntos !== null ? puntos : "—"}
                </span>
                <span className="text-xs text-[#A1887F] mb-1">puntos</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-[#EFEBE9] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#8D6E63] transition-all duration-500"
                  style={{ width: `${puntos !== null ? Math.min((puntos / NEXT_MILESTONE) * 100, 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-[#A1887F] mt-1.5">
                {puntos !== null
                  ? puntos >= NEXT_MILESTONE
                    ? "¡Listo para canjear un descuento!"
                    : `${NEXT_MILESTONE - puntos} puntos para tu proximo descuento`
                  : "Inicia sesion para ver tus puntos"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
