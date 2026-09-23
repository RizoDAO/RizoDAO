"use client";

import { CalendarDays, Check, Clock3, MessageCircle, UserRound } from "lucide-react";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export type AgendaAppointment = {
  id: string;
  clientName: string;
  clientInitials: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  status: AppointmentStatus;
};

const statusStyles: Record<AppointmentStatus, { label: string; badge: string }> = {
  pending: { label: "Pendiente", badge: "bg-[#FFF3CD] text-[#8A5A00]" },
  confirmed: { label: "Confirmada", badge: "bg-[#E1F5EE] text-[#0F6E56]" },
  cancelled: { label: "Cancelada", badge: "bg-[#EFEBE9] text-[#6D6D6D]" },
};

type AppointmentCardProps = {
  appointment: AgendaAppointment;
  onConfirm?: (id: string) => void;
};

export default function AppointmentCard({ appointment, onConfirm }: AppointmentCardProps) {
  const status = statusStyles[appointment.status];

  return (
    <article className="bg-white rounded-2xl border border-[#D7CCC8] p-4 sm:p-5">
      <div className="flex gap-3">
        <div className="w-10 h-10 shrink-0 rounded-full bg-[#EFEBE9] text-[#8D6E63] flex items-center justify-center font-bold text-sm">
          {appointment.clientInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <h3 className="font-semibold text-[#3E2723]">{appointment.clientName}</h3>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.badge}`}>{status.label}</span>
          </div>
          <p className="text-sm text-[#6D4C41] mt-0.5">{appointment.service}</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#6D4C41]">
            <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-[#8D6E63]" />{appointment.date}</span>
            <span className="flex items-center gap-1.5"><Clock3 className="w-4 h-4 text-[#8D6E63]" />{appointment.time}</span>
          </div>
          {appointment.notes && <p className="mt-3 flex gap-1.5 text-xs text-[#6D4C41]"><MessageCircle className="w-4 h-4 shrink-0 text-[#A1887F]" />{appointment.notes}</p>}
          {appointment.status === "pending" && onConfirm && (
            <button onClick={() => onConfirm(appointment.id)} className="mt-4 inline-flex items-center gap-1.5 bg-[#0F6E56] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#0B5A46] transition-colors">
              <Check className="w-4 h-4" />Confirmar cita
            </button>
          )}
          {appointment.status === "cancelled" && <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#6D6D6D]"><UserRound className="w-4 h-4" />Esta cita ya no está activa.</p>}
        </div>
      </div>
    </article>
  );
}
