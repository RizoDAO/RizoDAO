"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type CurlProfile = {
  hairType: string;
  porosity: string;
  thickness: string;
  length: string;
};

export type ProductResult = {
  id: string;
  name: string;
  brandName: string;
  price: number;
  tokenPrice: number;
  imageUrl: string | null;
  category: string | null;
  rating: number;
};

type Props = {
  profile: CurlProfile;
  products: ProductResult[];
  onRetake: () => void;
};

const CURL_DESCRIPTIONS: Record<string, { label: string; description: string; emoji: string }> = {
  "2A": { label: "Ondulado Suave", emoji: "〰️", description: "Ondas suaves en forma de S. Tu cabello tiene movimiento natural y necesita hidratación ligera." },
  "2B": { label: "Ondulado Definido", emoji: "〰️", description: "Ondas más marcadas con tendencia al frizz. Busca productos que definan sin pesar." },
  "2C": { label: "Ondulado Intenso", emoji: "〰️", description: "Ondas muy definidas que casi forman rizos. Necesitas humectación y control del frizz." },
  "3A": { label: "Rizado Amplio", emoji: "🌀", description: "Rizos grandes y brillantes. Tu cabello responde bien a geles y cremas ligeras." },
  "3B": { label: "Rizado Medio", emoji: "🌀", description: "Rizos medianos con mucho volumen. Necesitas hidratación profunda y sellado de humedad." },
  "3C": { label: "Rizado Apretado", emoji: "🌀", description: "Rizos apretados y densos. Prioriza la hidratación y evita el calor directo." },
  "4A": { label: "Coily Suave", emoji: "🔁", description: "Rizos en forma de S muy apretados. Tu cabello necesita mucha humedad y aceites nutritivos." },
  "4B": { label: "Coily Angular", emoji: "🔁", description: "Patrón en zigzag. Muy poroso y necesita sellado constante de humedad." },
  "4C": { label: "Coily Denso", emoji: "🔁", description: "El patrón más apretado. Requiere la mayor hidratación y técnicas de retención de humedad." },
};

const POROSITY_TIPS: Record<string, string> = {
  baja: "Tu cabello tarda en absorber humedad pero la retiene bien. Usa calor suave para abrir la cutícula.",
  media: "Tu cabello absorbe y retiene la humedad de forma equilibrada. La mayoría de productos funcionan bien.",
  alta: "Tu cabello absorbe rápido pero pierde humedad igual de rápido. Sella siempre con aceites o cremas.",
};

const MXN_PER_USDC = 19;

export default function ResultCard({ profile, products, onRetake }: Props) {
  const router = useRouter();
  const curlInfo = CURL_DESCRIPTIONS[profile.hairType] ?? {
    label: profile.hairType,
    emoji: "💇",
    description: "Perfil de cabello único.",
  };
  const porosityTip = POROSITY_TIPS[profile.porosity] ?? "";

  const handleProductClick = (product: ProductResult) => {
    const checkout = {
      id: product.id,
      nombre: product.name,
      marca: product.brandName,
      precioUSDC: product.price,
      precioMXN: Math.round(product.price * MXN_PER_USDC),
      imagen: product.imageUrl ?? "",
      tokens: product.tokenPrice,
    };
    sessionStorage.setItem("productoSeleccionado", JSON.stringify(checkout));
    router.push("/checkout");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">

      {/* Profile header */}
      <div className="bg-white rounded-3xl border border-[#D7CCC8] p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #EFEBE9, #D7CCC8)" }}
          >
            {curlInfo.emoji}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#A1887F] uppercase tracking-wider mb-1">
              Tu tipo de rizo
            </p>
            <h2
              className="text-2xl md:text-3xl font-bold text-[#3E2723] mb-1"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {profile.hairType} — {curlInfo.label}
            </h2>
            <p className="text-sm text-[#6D4C41] leading-relaxed">
              {curlInfo.description}
            </p>
          </div>
        </div>

        {/* Profile stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-[#FAF8F5]">
          {[
            { label: "Porosidad", value: profile.porosity },
            { label: "Grosor", value: profile.thickness },
            { label: "Largo", value: profile.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#FAF8F5] rounded-xl p-3 text-center"
            >
              <p
                className="text-base font-bold text-[#8D6E63] capitalize"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {stat.value}
              </p>
              <p className="text-xs text-[#A1887F] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Porosity tip */}
      {porosityTip && (
        <div className="bg-gradient-to-r from-[#EFEBE9] to-[#FAF8F5] rounded-2xl border border-[#D7CCC8] p-5 flex gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-[#3E2723] mb-1">
              Consejo para porosidad {profile.porosity}
            </p>
            <p className="text-xs text-[#6D4C41] leading-relaxed">{porosityTip}</p>
          </div>
        </div>
      )}

      {/* Recommended products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-lg font-bold text-[#3E2723]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Productos recomendados para ti
          </h3>
          <Link
            href="/tienda"
            className="text-xs text-[#8D6E63] hover:underline font-medium"
          >
            Ver todos →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#D7CCC8] p-12 text-center">
            <span className="text-4xl mb-3 block">🧴</span>
            <p className="text-sm font-semibold text-[#3E2723]">
              Pronto habrá productos para tu perfil
            </p>
            <p className="text-xs text-[#A1887F] mt-1">
              Mientras tanto, explora toda la tienda
            </p>
            <Link
              href="/tienda"
              className="inline-block mt-4 bg-[#8D6E63] text-white text-sm px-5 py-2.5 rounded-full hover:bg-[#6D4C41] transition-colors"
            >
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-2xl overflow-hidden border border-[#D7CCC8] shadow-sm hover:shadow-md transition-all text-left group"
              >
                <div className="aspect-square bg-[#EFEBE9] overflow-hidden">
                  <img
                    src={product.imageUrl ?? ""}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='%23EFEBE9'%3E%3Crect width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='40'%3E%F0%9F%A7%B4%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className="p-4 space-y-1.5">
                  <p className="text-xs text-[#A1887F]">{product.brandName}</p>
                  <h4
                    className="text-sm font-semibold text-[#3E2723] leading-snug line-clamp-2"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {product.name}
                  </h4>
                  <p className="text-base font-bold text-[#8D6E63]">
                    ${Math.round(product.price * MXN_PER_USDC).toLocaleString("es-MX")} MXN
                  </p>
                  {product.tokenPrice > 0 && (
                    <div className="inline-flex items-center gap-1 bg-[#EFEBE9] text-[#6D4C41] text-xs font-medium px-2 py-0.5 rounded-full">
                      🪙 +{product.tokenPrice} pts
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <button
          onClick={onRetake}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold border-2 border-[#D7CCC8] text-[#6D4C41] hover:border-[#8D6E63] transition-colors"
        >
          Repetir diagnóstico
        </button>
        <Link
          href="/perfil"
          className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#8D6E63] text-white hover:bg-[#6D4C41] transition-colors text-center"
        >
          Ver mi perfil →
        </Link>
      </div>
    </div>
  );
}
