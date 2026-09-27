"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAccesly } from "accesly";
import { getAllRutinas, getRutinaByCurlPattern, CurlPattern, Rutina } from "@/lib/rutinas";
import RutinaCard from "@/components/rutinas/RutinaCard";
import { Sparkles } from "lucide-react";

const patterns: (CurlPattern | "Todas")[] = ["Todas", "2A", "2B", "3A", "3B", "4A", "4B", "4C"];

export default function RutinasPage() {
  const [filtro, setFiltro] = useState<CurlPattern | "Todas">("Todas");
  const [userHairType, setUserHairType] = useState<CurlPattern | null>(null);
  const { data: session } = useSession();
  const { wallet } = useAccesly();

  const userEmail = session?.user?.email || wallet?.email;
  const rutinas = getAllRutinas();

  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/user/me?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.hairType && typeof data.hairType === "string") {
          setUserHairType(data.hairType.toUpperCase() as CurlPattern);
        }
      })
      .catch(() => {});
  }, [userEmail]);

  const rutinaSugerida = userHairType ? getRutinaByCurlPattern(userHairType) : undefined;
  
  const rutinasFiltradas = filtro === "Todas" 
    ? rutinas 
    : rutinas.filter((r) => r.curlPattern === filtro);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold text-[#3E2723] mb-2"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Rutinas Capilares
          </h1>
          <p className="text-[#A1887F]">
            Encuentra la rutina perfecta para tu patrón de rizo y características únicas.
          </p>
        </div>

        {/* Sugerida para ti */}
        {rutinaSugerida && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#8D6E63]" />
              <h2
                className="text-xl font-bold text-[#3E2723]"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Tu Rutina Sugerida
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <RutinaCard rutina={rutinaSugerida} isSuggested={true} />
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 min-w-max">
            {patterns.map((p) => (
              <button
                key={p}
                onClick={() => setFiltro(p)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  filtro === p
                    ? "bg-[#8D6E63] text-white"
                    : "bg-white text-[#6D4C41] border border-[#D7CCC8] hover:border-[#8D6E63] hover:text-[#8D6E63]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rutinasFiltradas.map((rutina) => (
            <RutinaCard
              key={rutina.id}
              rutina={rutina}
              isSuggested={rutina.id === rutinaSugerida?.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
