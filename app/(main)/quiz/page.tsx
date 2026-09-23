"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const HAIR_TYPES = [
  { id: "2a", label: "2A", titulo: "Ondulado suave", desc: "Ondas ligeras en S, cabello fino" },
  { id: "2b", label: "2B", titulo: "Ondulado definido", desc: "Ondas marcadas, algo de volumen" },
  { id: "2c", label: "2C", titulo: "Ondulado intenso", desc: "Ondas gruesas, propenso al frizz" },
  { id: "3a", label: "3A", titulo: "Rizado amplio", desc: "Rizos grandes y elásticos" },
  { id: "3b", label: "3B", titulo: "Rizado compacto", desc: "Rizos medianos con mucho volumen" },
  { id: "3c", label: "3C", titulo: "Muy rizado", desc: "Rizos apretados tipo sacacorchos" },
  { id: "4a", label: "4A", titulo: "Afro suave", desc: "Rizos muy apretados en forma de S" },
  { id: "4b", label: "4B", titulo: "Afro angular", desc: "Patrón en zigzag, muy denso" },
  { id: "4c", label: "4C", titulo: "Afro compacto", desc: "El rizo más apretado, máximo volumen" },
];

export default function QuizPage() {
  const [selected, setSelected] = useState("");
  const router = useRouter();

  const handleVer = () => {
    if (selected) router.push(`/quiz/resultado?tipo=${selected}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <span className="text-3xl mb-3 block">🌀</span>
          <h1
            className="text-2xl md:text-3xl font-bold text-[#3E2723] mb-2"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            ¿Cuál es tu tipo de rizo?
          </h1>
          <p className="text-[#A1887F] text-sm">
            Selecciona tu tipo de cabello y te recomendaremos la rutina perfecta
          </p>
        </div>

        <div className="w-full rounded-2xl overflow-hidden mb-6 border border-[#D7CCC8]">
          <img src="/TipoRizo.jpeg" alt="Tipos de rizo" className="w-full object-cover" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {HAIR_TYPES.map((tipo) => (
            <button
              key={tipo.id}
              onClick={() => setSelected(tipo.id)}
              className="flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all"
              style={{
                borderColor: selected === tipo.id ? "#8D6E63" : "#D7CCC8",
                backgroundColor: selected === tipo.id ? "#EFEBE9" : "white",
              }}
            >
              <span
                className="text-lg font-bold text-[#8D6E63] mb-1"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {tipo.label}
              </span>
              <p className="text-xs font-semibold text-[#3E2723]">{tipo.titulo}</p>
              <p className="text-xs text-[#A1887F] mt-0.5">{tipo.desc}</p>
              {selected === tipo.id && (
                <span className="mt-2 text-xs font-medium text-[#8D6E63]">✓ Seleccionado</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleVer}
          disabled={!selected}
          className="w-full bg-[#8D6E63] text-white py-4 rounded-2xl text-base font-semibold hover:bg-[#6D4C41] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Ver mi rutina personalizada →
        </button>
      </div>
    </div>
  );
}
