"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Producto = {
  id: number;
  nombre: string;
  marca: string;
  precio: number;
  calificacion: number;
  resenas: number;
  tipo: "marca" | "estilista";
  categoria: string;
  tipoRizo: string[];
  color: string;
};

export default function ProductCard({ producto }: { producto: Producto }) {
  const [votado, setVotado] = useState<null | "bueno" | "malo">(null);
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/tienda/${producto.id}`)}
      className="bg-white rounded-2xl border border-[#D7CCC8] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >

      {/* Imagen placeholder */}
      <div className="w-full h-44 flex items-center justify-center"
        style={{ backgroundColor: producto.color }}>
        <span className="text-4xl">🧴</span>
      </div>

      <div className="p-4 flex flex-col gap-2">

        {/* Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: producto.tipo === "marca" ? "#EEEDFE" : "#E1F5EE",
              color: producto.tipo === "marca" ? "#534AB7" : "#0F6E56"
            }}>
            {producto.tipo === "marca" ? "Marca verificada" : "Estilista verificado"}
          </span>
          <span className="text-xs text-[#A1887F]">{producto.categoria}</span>
        </div>

        {/* Nombre y marca */}
        <div>
          <p className="text-sm font-bold text-[#3E2723]">{producto.nombre}</p>
          <p className="text-xs text-[#A1887F]">{producto.marca}</p>
        </div>

        {/* Calificacion */}
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map((star) => (
            <span key={star} className="text-xs"
              style={{ color: star <= producto.calificacion ? "#C89B4F" : "#D7CCC8" }}>
              ★
            </span>
          ))}
          <span className="text-xs text-[#A1887F] ml-1">({producto.resenas})</span>
        </div>

        {/* Tipo de rizo */}
        <div className="flex flex-wrap gap-1">
          {producto.tipoRizo.map((tipo) => (
            <span key={tipo} className="text-xs px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#6D4C41]">
              {tipo}
            </span>
          ))}
        </div>

        {/* Precio y acciones */}
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#FAF8F5]">
          <span className="text-base font-bold text-[#3E2723]">${producto.precio} MXN</span>
          <div className="flex items-center gap-2">
            {!votado ? (
              <div className="flex items-center gap-1">
                <button onClick={() => setVotado("bueno")}
                  className="text-xs px-2 py-1 rounded-lg bg-[#E1F5EE] text-[#0F6E56] hover:opacity-80 transition-opacity flex items-center gap-1">
                  <span>👍</span> 1 token
                </button>
                <button onClick={() => setVotado("malo")}
                  className="text-xs px-2 py-1 rounded-lg bg-[#FBEAF2] text-[#993556] hover:opacity-80 transition-opacity flex items-center gap-1">
                  <span>👎</span>
                </button>
              </div>
            ) : (
              <span className="text-xs text-[#A1887F]">
                {votado === "bueno" ? "Marcado como bueno" : "Marcado como malo"}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}