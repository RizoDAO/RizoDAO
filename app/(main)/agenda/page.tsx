"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useAccesly } from "accesly";
import { CalendarCheck2, CheckCircle2, LockKeyhole } from "lucide-react";
import AppointmentCard, { AgendaAppointment } from "@/components/agenda/AppointmentCard";

const mockAppointments: AgendaAppointment[] = [
  {
    id: "appointment-1",
    clientName: "Ana Martínez",
    clientInitials: "AM",
    service: "Corte y definición de rizos",
    date: "Próximo martes, 12 ago.",
    time: "10:00 h",
    notes: "Tengo cabello 3B y quiero conservar el largo.",
    status: "pending",
  },
  {
    id: "appointment-2",
    clientName: "Laura Gómez",
    clientInitials: "LG",
    service: "Tratamiento capilar profundo",
    date: "Jueves, 14 ago.",
    time: "16:30 h",
    status: "confirmed",
  },
  {
    id: "appointment-3",
    clientName: "María Torres",
    clientInitials: "MT",
    service: "Asesoría de rutina",
    date: "Viernes, 15 ago.",
    time: "12:00 h",
    status: "cancelled",
  },
];

function isProfessional(role: string | null) {
  return role === "ESTILISTA" || role === "PROFESIONAL";
}

export default function AgendaPage() {
  const { data: session, status } = useSession();
  const { wallet } = useAccesly();
  const [fetchedRole, setFetchedRole] = useState<string | null | undefined>(undefined);
  const [appointments, setAppointments] = useState(mockAppointments);
  const [confirmation, setConfirmation] = useState("");
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  const email = session?.user?.email || wallet?.email;
  const role = sessionRole ?? fetchedRole;

  useEffect(() => {
    if (sessionRole || !email) return;

    let active = true;
    fetch(`/api/user/me?email=${encodeURIComponent(email)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((user) => { if (active) setFetchedRole(user?.role ?? null); })
      .catch(() => { if (active) setFetchedRole(null); });
    return () => { active = false; };
  }, [email, sessionRole, status]);

  const confirmAppointment = (id: string) => {
    const appointment = appointments.find((item) => item.id === id);
    setAppointments((items) => items.map((item) => item.id === id ? { ...item, status: "confirmed" } : item));
    if (appointment) setConfirmation(`La cita de ${appointment.clientName} fue confirmada.`);
  };

  if (status === "loading" || (!sessionRole && Boolean(email) && fetchedRole === undefined)) {
    return <div className="max-w-6xl mx-auto px-6 py-20"><div className="w-8 h-8 border-2 border-[#8D6E63] border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  if (!isProfessional(role ?? null)) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#EFEBE9] text-[#8D6E63] flex items-center justify-center mx-auto mb-4"><LockKeyhole className="w-6 h-6" /></div>
        <h1 className="text-2xl font-bold text-[#3E2723]" style={{ fontFamily: "var(--font-playfair)" }}>Agenda para profesionales</h1>
        <p className="text-sm text-[#6D4C41] mt-3">Esta sección está disponible solo para cuentas de estilista profesional.</p>
        <Link href={email ? "/perfil" : "/login"} className="inline-flex mt-6 bg-[#8D6E63] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#6D4C41] transition-colors">
          {email ? "Ver mi perfil" : "Iniciar sesión"}
        </Link>
      </div>
    );
  }

  const pending = appointments.filter((appointment) => appointment.status === "pending");
  const confirmed = appointments.filter((appointment) => appointment.status === "confirmed");
  const cancelled = appointments.filter((appointment) => appointment.status === "cancelled");

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#8D6E63] text-white flex items-center justify-center"><CalendarCheck2 className="w-5 h-5" /></div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#3E2723]" style={{ fontFamily: "var(--font-playfair)" }}>Mi agenda</h1>
          </div>
          <p className="text-sm text-[#6D4C41]">Gestiona las solicitudes y citas confirmadas de tus clientes.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-[#FFF3CD] text-[#8A5A00] px-3 py-1.5 font-medium">{pending.length} pendientes</span>
          <span className="rounded-full bg-[#E1F5EE] text-[#0F6E56] px-3 py-1.5 font-medium">{confirmed.length} confirmadas</span>
        </div>
      </div>

      {confirmation && <div role="status" className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-[#B7E4C7] bg-[#E1F5EE] px-4 py-3 text-sm text-[#0F6E56]"><span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />{confirmation}</span><button onClick={() => setConfirmation("")} aria-label="Cerrar confirmación" className="font-bold">×</button></div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <section className="bg-[#FFFDF8] rounded-3xl border border-[#E6D6B2] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-[#3E2723]">Por confirmar</h2><span className="text-xs font-medium text-[#8A5A00] bg-[#FFF3CD] rounded-full px-2.5 py-1">{pending.length}</span></div>
          <div className="space-y-3">
            {pending.length ? pending.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} onConfirm={confirmAppointment} />) : <EmptyAgenda text="No tienes solicitudes pendientes." />}
          </div>
        </section>
        <section className="bg-[#FBFFFC] rounded-3xl border border-[#B7E4C7] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-[#3E2723]">Próximas citas</h2><span className="text-xs font-medium text-[#0F6E56] bg-[#E1F5EE] rounded-full px-2.5 py-1">{confirmed.length}</span></div>
          <div className="space-y-3">
            {confirmed.length ? confirmed.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />) : <EmptyAgenda text="Tus citas confirmadas aparecerán aquí." />}
          </div>
        </section>
      </div>

      {cancelled.length > 0 && <section className="mt-6"><h2 className="text-sm font-semibold text-[#6D4C41] mb-3">Canceladas</h2><div className="grid grid-cols-1 xl:grid-cols-2 gap-3">{cancelled.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)}</div></section>}
    </div>
  );
}

function EmptyAgenda({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#D7CCC8] bg-white/70 py-10 px-4 text-center text-sm text-[#A1887F]">{text}</div>;
}
