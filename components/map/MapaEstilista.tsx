"use client";
import { useEffect, useState } from "react";

interface Stylist {
  id: string;
  nombre: string;
  handle: string;
  especialidad: string;
  calificacion: number;
  resenas: number;
  lat: number | null;
  lng: number | null;
  disponible: boolean;
}

const ChangeView = ({ center, useMap }: { center: [number, number]; useMap: () => any }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
};

export default function MapaEstilistas() {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [estilistas, setEstilistas] = useState<Stylist[]>([]);
  const [cargando, setCargando] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number]>([19.4326, -99.1332]); // CDMX fallback
  const [leafletLib, setLeafletLib] = useState<any>(null);

  // Fetch stylists from API
  useEffect(() => {
    fetch("/api/estilistas")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((u: any, idx: number) => ({
            id: u.id,
            nombre: u.name || u.email.split("@")[0],
            handle: `@${u.email.split("@")[0]}`,
            especialidad: u.hairType 
              ? `Especialista en rizos ${u.hairType.toUpperCase()}` 
              : (u.bio || "Estilista Profesional"),
            calificacion: 4 + (idx % 2 === 0 ? 0.9 : 0.8), // pseudo-random rating
            resenas: 10 + (idx * 7) % 150, // pseudo-random reviews
            lat: u.latitude,
            lng: u.longitude,
            disponible: u.latitude !== null && u.longitude !== null,
          }));
          setEstilistas(mapped);
        }
      })
      .catch((err) => {
        console.error("Error fetching stylists:", err);
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

  // Fetch user location
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation denied or error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Load Leaflet library dynamically (SSR workaround)
  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([reactLeaflet, L]) => {
      // Fix default Leaflet icon assets
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setLeafletLib(reactLeaflet);
    });
  }, []);

  const handleAgendar = (nombre: string) => {
    alert(`¡Reserva iniciada! Tu cita con ${nombre} se está procesando.`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3E2723]"
          style={{ fontFamily: "var(--font-playfair)" }}>
          Estilistas cerca de ti
        </h1>
        <p className="text-sm text-[#A1887F] mt-1">
          Encuentra especialistas en cabello rizado verificados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lista estilistas */}
        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
          {cargando ? (
            <div className="text-center py-10 text-sm text-[#A1887F]">
              Cargando estilistas...
            </div>
          ) : estilistas.length === 0 ? (
            <div className="text-center py-10 text-sm text-[#A1887F]">
              No hay estilistas registrados en el sistema.
            </div>
          ) : (
            estilistas.map((e) => (
              <div key={e.id} onClick={() => setSeleccionado(e.id)}
                className="bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md w-full cursor-pointer"
                style={{ borderColor: seleccionado === e.id ? "#8D6E63" : "#D7CCC8" }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D7CCC8] flex items-center justify-center font-bold text-[#8D6E63] flex-shrink-0">
                    {e.nombre[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#3E2723] truncate">{e.nombre}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: e.disponible ? "#E1F5EE" : "#FAF8F5",
                          color: e.disponible ? "#0F6E56" : "#A1887F"
                        }}>
                        {e.disponible ? "Disponible" : "Sin ubicación"}
                      </span>
                    </div>
                    <p className="text-xs text-[#A1887F]">{e.handle}</p>
                    <p className="text-xs text-[#6D4C41] mt-1">{e.especialidad}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map((star) => (
                        <span key={star} className="text-xs"
                          style={{ color: star <= e.calificacion ? "#C89B4F" : "#D7CCC8" }}>★</span>
                      ))}
                      <span className="text-xs text-[#A1887F] ml-1">({e.resenas})</span>
                    </div>
                  </div>
                </div>
                {seleccionado === e.id && (
                  <button 
                    onClick={(evt) => {
                      evt.stopPropagation();
                      handleAgendar(e.nombre);
                    }}
                    className="mt-3 w-full bg-[#8D6E63] text-white py-2 rounded-xl text-xs font-medium hover:bg-[#6D4C41] transition-colors"
                  >
                    Agendar cita
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Mapa */}
        <div className="lg:col-span-2 relative h-96 lg:h-auto min-h-[400px]">
          <div className="absolute inset-0 rounded-2xl overflow-hidden border border-[#D7CCC8] bg-[#D7CCC8]">
            {leafletLib ? (
              <leafletLib.MapContainer
                center={userLocation}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <ChangeView center={userLocation} useMap={leafletLib.useMap} />
                <leafletLib.TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {estilistas
                  .filter((e) => e.lat !== null && e.lng !== null)
                  .map((e) => (
                    <leafletLib.Marker 
                      key={e.id} 
                      position={[e.lat, e.lng]}
                      eventHandlers={{ click: () => setSeleccionado(e.id) }}
                    >
                      <leafletLib.Popup>
                        <div style={{ fontFamily: "sans-serif", minWidth: 140 }}>
                          <p style={{ fontWeight: 700, marginBottom: 2, color: "#3E2723" }}>{e.nombre}</p>
                          <p style={{ fontSize: 11, color: "#A1887F", margin: "0 0 4px 0" }}>{e.especialidad}</p>
                          <button
                            onClick={() => handleAgendar(e.nombre)}
                            className="mt-2 w-full bg-[#8D6E63] text-white py-1.5 rounded-lg text-xs font-medium hover:bg-[#6D4C41] transition-colors"
                            style={{ border: "none", cursor: "pointer" }}
                          >
                            Agendar
                          </button>
                        </div>
                      </leafletLib.Popup>
                    </leafletLib.Marker>
                  ))}
              </leafletLib.MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-[#A1887F]">Cargando mapa...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}