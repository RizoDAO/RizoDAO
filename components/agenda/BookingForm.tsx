"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, X } from "lucide-react";

export type BookingDetails = {
  stylistId: string;
  stylistName: string;
  date: string;
  time: string;
  notes: string;
};

type BookingFormProps = {
  stylist: {
    id: string;
    nombre: string;
    especialidad: string;
    precio: string;
  };
  onClose: () => void;
  onBooked: (booking: BookingDetails) => void;
};

function localDateValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function BookingForm({ stylist, onClose, onBooked }: BookingFormProps) {
  const today = useMemo(() => localDateValue(), []);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [booked, setBooked] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedDate = new Date(`${date}T${time}`);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
      setError("Selecciona una fecha y hora futuras.");
      return;
    }

    setError("");
    onBooked({
      stylistId: stylist.id,
      stylistName: stylist.nombre,
      date,
      time,
      notes: notes.trim(),
    });
    setBooked(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <button aria-label="Cerrar formulario" className="absolute inset-0 bg-[#3E2723]/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-[#D7CCC8] shadow-xl p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-[#8D6E63] mb-1">Nueva cita</p>
            <h2 id="booking-title" className="text-xl font-bold text-[#3E2723]" style={{ fontFamily: "var(--font-playfair)" }}>
              Agenda con {stylist.nombre}
            </h2>
            <p className="text-xs text-[#A1887F] mt-1">{stylist.especialidad} · ${stylist.precio} MXN</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 -mr-2 text-[#6D4C41] hover:bg-[#EFEBE9] rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {booked ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#0F6E56] mx-auto mb-3" />
            <h3 className="font-semibold text-[#3E2723]">Solicitud enviada</h3>
            <p className="text-sm text-[#6D4C41] mt-2">{stylist.nombre} verá tu cita y podrá confirmarla desde su agenda.</p>
            <button onClick={onClose} className="mt-6 bg-[#8D6E63] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#6D4C41] transition-colors">
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-[#6D4C41]">
                <span className="flex items-center gap-1.5 mb-1.5"><CalendarDays className="w-4 h-4" /> Fecha</span>
                <input required min={today} type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-3 py-2.5 text-sm text-[#3E2723] focus:outline-none focus:border-[#8D6E63]" />
              </label>
              <label className="block text-sm font-medium text-[#6D4C41]">
                <span className="flex items-center gap-1.5 mb-1.5"><Clock3 className="w-4 h-4" /> Hora</span>
                <input required type="time" min={date === today ? new Date().toTimeString().slice(0, 5) : undefined} value={time} onChange={(event) => setTime(event.target.value)} className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-3 py-2.5 text-sm text-[#3E2723] focus:outline-none focus:border-[#8D6E63]" />
              </label>
            </div>
            <label className="block text-sm font-medium text-[#6D4C41]">
              Mensaje para la profesional <span className="font-normal text-[#A1887F]">(opcional)</span>
              <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Cuéntale qué servicio necesitas..." className="mt-1.5 w-full resize-none bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-3 py-2.5 text-sm text-[#3E2723] placeholder:text-[#BCAAA4] focus:outline-none focus:border-[#8D6E63]" />
            </label>
            {error && <p role="alert" className="text-sm text-[#B42318] bg-[#FEE4E2] rounded-xl px-3 py-2.5">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-medium text-[#6D4C41] hover:bg-[#EFEBE9]">Cancelar</button>
              <button type="submit" className="bg-[#8D6E63] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#6D4C41] transition-colors">Solicitar cita</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
