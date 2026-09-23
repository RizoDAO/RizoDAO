"use client";
import { useState } from "react";
import { MapPin, Star, Video, Calendar, Sparkles } from "lucide-react";
import BookingForm, { BookingDetails } from "@/components/agenda/BookingForm";

type Categoria = "Todos" | "Cabello";

interface Profesional {
  id: string;
  nombre: string;
  username: string;
  iniciales: string;
  especialidad: string;
  categoria: string;
  emojiCategoria: string;
  ubicacion: string;
  calificacion: number;
  resenas: number;
  precio: string;
  verificado: boolean;
  ofrecevideo: boolean;
}

const profesionales: Profesional[] = [
  {
    id: "1",
    nombre: "Valeria Morales",
    username: "@rizosvaleria",
    iniciales: "VM",
    especialidad: "Cortes para rizos 3A-4C",
    categoria: "Cabello",
    emojiCategoria: "💇",
    ubicacion: "CDMX, México",
    calificacion: 4.9,
    resenas: 127,
    precio: "500 - 800",
    verificado: true,
    ofrecevideo: true,
  },
  {
    id: "2",
    nombre: "Carmen Delgado",
    username: "@carmencurls",
    iniciales: "CD",
    especialidad: "Tratamientos capilares profundos",
    categoria: "Cabello",
    emojiCategoria: "💇",
    ubicacion: "Guadalajara, Jalisco",
    calificacion: 5.0,
    resenas: 89,
    precio: "400 - 700",
    verificado: true,
    ofrecevideo: true,
  },
  {
    id: "3",
    nombre: "Sofia Ramírez",
    username: "@sofiamakeup",
    iniciales: "SR",
    especialidad: "Maquillaje artístico y nupcial",
    categoria: "Maquillaje",
    emojiCategoria: "💄",
    ubicacion: "Monterrey, NL",
    calificacion: 4.8,
    resenas: 156,
    precio: "600 - 1,200",
    verificado: true,
    ofrecevideo: false,
  },
  {
    id: "4",
    nombre: "Daniela Torres",
    username: "@danielaskin",
    iniciales: "DT",
    especialidad: "Skincare personalizado",
    categoria: "Skincare",
    emojiCategoria: "✨",
    ubicacion: "Puebla, Puebla",
    calificacion: 5.0,
    resenas: 203,
    precio: "450 - 900",
    verificado: true,
    ofrecevideo: true,
  },
  {
    id: "5",
    nombre: "Mariana López",
    username: "@mariananails",
    iniciales: "ML",
    especialidad: "Nail art & gelish",
    categoria: "Uñas",
    emojiCategoria: "💅",
    ubicacion: "CDMX, México",
    calificacion: 4.7,
    resenas: 98,
    precio: "350 - 600",
    verificado: true,
    ofrecevideo: false,
  },
  {
    id: "6",
    nombre: "Andrea Vega",
    username: "@andreavega",
    iniciales: "AV",
    especialidad: "Diseño de cejas y laminado",
    categoria: "Cejas & Pestañas",
    emojiCategoria: "👁️",
    ubicacion: "Querétaro, QRO",
    calificacion: 4.9,
    resenas: 74,
    precio: "300 - 550",
    verificado: false,
    ofrecevideo: true,
  },
  {
    id: "7",
    nombre: "Lucía Herrera",
    username: "@luciaspa",
    iniciales: "LH",
    especialidad: "Masajes terapéuticos y relajantes",
    categoria: "Spa",
    emojiCategoria: "🧘",
    ubicacion: "Guadalajara, Jalisco",
    calificacion: 4.8,
    resenas: 61,
    precio: "550 - 850",
    verificado: true,
    ofrecevideo: false,
  },
  {
    id: "8",
    nombre: "Renata Solis",
    username: "@renatamakeup",
    iniciales: "RS",
    especialidad: "Maquillaje natural y contouring",
    categoria: "Maquillaje",
    emojiCategoria: "💄",
    ubicacion: "CDMX, México",
    calificacion: 4.6,
    resenas: 112,
    precio: "500 - 1,000",
    verificado: true,
    ofrecevideo: true,
  },
];

const CATEGORIAS: Categoria[] = ["Todos", "Cabello"];

const EMOJI_CATEGORIA: Record<Categoria, string> = {
  Todos: "🌟",
  Cabello: "💇",
};

export default function ProfesionalesPage() {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>("Todos");
  const [profesionalParaCita, setProfesionalParaCita] = useState<Profesional | null>(null);
  const [confirmation, setConfirmation] = useState("");

  const filtrados = profesionales.filter((p) => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.especialidad.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria =
      categoriaActiva === "Todos" || p.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

  const handleBooked = (booking: BookingDetails) => {
    setConfirmation(`Tu solicitud para el ${booking.date} a las ${booking.time} fue enviada a ${booking.stylistName}.`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#8D6E63] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold text-[#3E2723]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Profesionales
            </h1>
          </div>
          <p className="text-[#6D4C41] mb-6 max-w-xl">
            Encuentra especialistas en belleza cerca de ti. Agenda citas y paga con tokens RIZO.
          </p>

          {/* Buscador */}
          <input
            type="text"
            placeholder="Buscar por nombre o especialidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 rounded-xl border border-[#D7CCC8] bg-white text-sm text-[#3E2723] placeholder:text-[#BCAAA4] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] transition-colors"
          />
        </div>

        {confirmation && (
          <div role="status" className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-[#B7E4C7] bg-[#E1F5EE] px-4 py-3 text-sm text-[#0F6E56]">
            <span><strong>Cita solicitada.</strong> {confirmation}</span>
            <button onClick={() => setConfirmation("")} aria-label="Cerrar confirmación" className="font-bold leading-none">×</button>
          </div>
        )}

        {/* Filtros por categoría */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categoriaActiva === cat
                  ? "bg-[#8D6E63] text-white"
                  : "bg-white border border-[#D7CCC8] text-[#6D4C41] hover:border-[#8D6E63] hover:text-[#8D6E63]"
              }`}
            >
              <span>{EMOJI_CATEGORIA[cat]}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de tarjetas */}
        {filtrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtrados.map((pro) => (
              <TarjetaProfesional key={pro.id} profesional={pro} onBook={() => setProfesionalParaCita(pro)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#A1887F]">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">No encontramos profesionales con ese criterio.</p>
            <p className="text-sm mt-1">Intenta con otro nombre o categoría.</p>
          </div>
        )}

        {/* Banner CTA */}
        <div className="mt-10 bg-white rounded-2xl border border-[#D7CCC8] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3
                className="text-lg font-bold text-[#3E2723] mb-1"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                ¿Eres profesional de la belleza?
              </h3>
              <p className="text-sm text-[#6D4C41]">
                Únete a RIZO y conecta con clientes que buscan tu especialidad.
                Recibe pagos con tokens y haz crecer tu negocio.
              </p>
            </div>
            <button className="shrink-0 bg-[#8D6E63] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#6D4C41] transition-colors">
              Registrarme como profesional
            </button>
          </div>
        </div>
      </div>
      {profesionalParaCita && (
        <BookingForm
          stylist={profesionalParaCita}
          onClose={() => setProfesionalParaCita(null)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}

function TarjetaProfesional({ profesional: p, onBook }: { profesional: Profesional; onBook: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header de la tarjeta */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar con iniciales */}
          <div className="w-14 h-14 rounded-2xl bg-[#EFEBE9] border border-[#D7CCC8] flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-[#8D6E63]">
              {p.iniciales}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-semibold text-[#3E2723] text-base">{p.nombre}</h3>
              {p.verificado && (
                <span className="inline-flex items-center gap-1 bg-[#E1F5EE] text-[#0F6E56] text-xs font-medium px-2 py-0.5 rounded-full">
                  ✓ Verificada
                </span>
              )}
            </div>
            <p className="text-xs text-[#A1887F] mb-2">{p.username}</p>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#C89B4F] fill-[#C89B4F]" />
                <span className="text-sm font-semibold text-[#3E2723]">{p.calificacion}</span>
                <span className="text-xs text-[#A1887F]">({p.resenas})</span>
              </div>
              {/* Video */}
              {p.ofrecevideo && (
                <span className="inline-flex items-center gap-1 border border-[#D7CCC8] text-xs text-[#6D4C41] px-2 py-0.5 rounded-full">
                  <Video className="w-3 h-3" />
                  Video consulta
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Especialidad */}
        <div className="bg-[#EFEBE9] rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-[#A1887F] mb-0.5">Especialidad</p>
          <div className="flex items-center gap-2">
            <span className="text-base">{p.emojiCategoria}</span>
            <p className="text-sm font-medium text-[#3E2723]">{p.especialidad}</p>
          </div>
        </div>

        {/* Ubicación y precio */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#A1887F] mb-1">
              <MapPin className="w-3.5 h-3.5" />
              Ubicación
            </div>
            <p className="text-sm font-medium text-[#3E2723]">{p.ubicacion}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#A1887F] mb-1">
              <span className="text-xs">🪙</span>
              Precio
            </div>
            <p className="text-sm font-medium text-[#3E2723]">${p.precio} MXN</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          <button onClick={onBook} className="flex-1 flex items-center justify-center gap-2 bg-[#8D6E63] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#6D4C41] transition-colors">
            <Calendar className="w-4 h-4" />
            Agendar cita
          </button>
          <button className="px-4 py-2.5 rounded-xl border border-[#D7CCC8] text-sm text-[#6D4C41] hover:border-[#8D6E63] hover:text-[#8D6E63] transition-colors">
            Ver perfil
          </button>
        </div>
      </div>

      {/* Footer de tokens */}
      <div className="bg-[#EFEBE9] px-6 py-2.5 border-t border-[#D7CCC8]">
        <p className="text-xs text-center text-[#A1887F]">
          ⚡ Paga con tokens y gana{" "}
          <span className="text-[#8D6E63] font-semibold">recompensas RIZO</span>
        </p>
      </div>
    </div>
  );
}
