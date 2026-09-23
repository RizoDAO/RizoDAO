"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Star, Loader2 } from "lucide-react";
import ReviewSection from "@/components/tienda/ReviewSection";

type ProductDetail = {
  id: string;
  name: string;
  brandName: string;
  price: number;
  tokenPrice: number;
  imageUrl: string | null;
  category: string | null;
  rating: number;
  votes: number;
  hairTypes: string | null;
  _count: { reviews: number };
};

const MXN_PER_USDC = 19;

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [productRating, setProductRating] = useState(0);
  const [productVotes, setProductVotes] = useState(0);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        setProductRating(data.rating);
        setProductVotes(data.votes);
      })
      .catch(() => router.replace("/tienda"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleRatingUpdate = (avg: number, count: number) => {
    setProductRating(avg);
    setProductVotes(count);
  };

  const handleBuy = () => {
    if (!product) return;
    sessionStorage.setItem(
      "productoSeleccionado",
      JSON.stringify({
        id: product.id,
        nombre: product.name,
        marca: product.brandName,
        precioMXN: Math.round(product.price * MXN_PER_USDC),
        precioUSDC: product.price,
        imagen: product.imageUrl ?? "",
        tokens: product.tokenPrice,
      })
    );
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#8D6E63] animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const precioMXN = Math.round(product.price * MXN_PER_USDC);
  const hairTypes = product.hairTypes?.split(",").filter(Boolean) ?? [];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <header className="bg-white border-b border-[#D7CCC8] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full border border-[#D7CCC8] flex items-center justify-center hover:bg-[#EFEBE9] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#6D4C41]" />
          </button>
          <h1
            className="text-lg font-semibold text-[#3E2723] truncate"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {product.name}
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Producto */}
        <div className="bg-white rounded-2xl border border-[#D7CCC8] overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2 aspect-square bg-[#EFEBE9] overflow-hidden">
              <img
                src={product.imageUrl ?? ""}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23EFEBE9'%3E%3Crect width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='80'%3E%F0%9F%A7%B4%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#A1887F] uppercase tracking-wider">{product.brandName}</p>
                  <h2
                    className="text-2xl font-bold text-[#3E2723] mt-1"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {product.name}
                  </h2>
                </div>

                {product.category && (
                  <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-[#EEEDFE] text-[#534AB7] font-medium">
                    {product.category}
                  </span>
                )}

                {/* Calificacion */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="w-4 h-4"
                        style={{ color: s <= Math.round(productRating) ? "#C89B4F" : "#D7CCC8" }}
                        fill={s <= Math.round(productRating) ? "#C89B4F" : "#D7CCC8"}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-[#3E2723]">{productRating}</span>
                  <span className="text-xs text-[#A1887F]">({productVotes} {productVotes === 1 ? "resena" : "resenas"})</span>
                </div>

                {/* Tipos de rizo */}
                {hairTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {hairTypes.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#6D4C41]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="inline-flex items-center gap-1 bg-[#EFEBE9] text-[#6D4C41] text-xs font-medium px-2.5 py-1 rounded-full">
                  🪙 +{product.tokenPrice} puntos
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#EFEBE9] space-y-3">
                <p className="text-3xl font-bold text-[#8D6E63]" style={{ fontFamily: "var(--font-playfair)" }}>
                  ${precioMXN.toLocaleString("es-MX")} MXN
                </p>
                <button
                  onClick={handleBuy}
                  className="w-full flex items-center justify-center gap-2 bg-[#8D6E63] text-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-[#6D4C41] transition-colors"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Comprar ahora
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resenas */}
        <ReviewSection productId={product.id} onRatingUpdate={handleRatingUpdate} />
      </div>
    </div>
  );
}
