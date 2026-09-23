"use client";

import { CheckCircle2, CalendarDays } from "lucide-react";
import { ReactNode } from "react";

type CredentialCardProps = {
  specialization: string;
  dateObtained: string;
  icon: ReactNode;
  verified?: boolean;
};

function formatDate(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CredentialCard({
  specialization,
  dateObtained,
  icon,
  verified = true,
}: CredentialCardProps) {
  return (
    <article className="bg-white rounded-2xl border border-[#D7CCC8] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#EFEBE9] border border-[#D7CCC8] flex items-center justify-center text-[#8D6E63] shrink-0">
          {icon}
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1 bg-[#E1F5EE] text-[#0F6E56] text-xs font-medium px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verificada on-chain
          </span>
        )}
      </div>

      <h3
        className="text-base font-semibold text-[#3E2723] mb-2"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        {specialization}
      </h3>

      <div className="inline-flex items-center gap-1.5 text-xs text-[#A1887F]">
        <CalendarDays className="w-3.5 h-3.5" />
        Obtenida: {formatDate(dateObtained)}
      </div>
    </article>
  );
}
