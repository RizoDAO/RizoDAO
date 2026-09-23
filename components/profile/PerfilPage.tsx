"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAccesly } from "accesly";
import Link from "next/link";

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  hairType: string | null;
  role: string;
  tokens: number;
  avatar: string | null;
  onboardingCompleted: boolean;
  latitude: number | null;
  longitude: number | null;
  _count: { posts: number; reviews: number };
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  RIZADA: { label: "Rizada", color: "bg-[#FBEAF2] text-[#993556]" },
  MARCA:  { label: "Marca",  color: "bg-[#EEEDFE] text-[#5B4DE8]" },
  ESTILISTA: { label: "Estilista", color: "bg-[#E1F5EE] text-[#0F6E56]" },
};

export default function PerfilPage() {
  const { data: session } = useSession();
  const { wallet } = useAccesly();
  const [tab, setTab] = useState<"publicaciones" | "resenas" | "guardados">("publicaciones");
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [cargando, setCargando] = useState(true);

  // States for profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [editCargandoUbicacion, setEditCargandoUbicacion] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const startEditing = () => {
    setEditName(perfil?.name || "");
    setEditBio(perfil?.bio || "");
    setEditLatitude(perfil?.latitude !== null && perfil?.latitude !== undefined ? String(perfil.latitude) : "");
    setEditLongitude(perfil?.longitude !== null && perfil?.longitude !== undefined ? String(perfil.longitude) : "");
    setEditError(null);
    setIsEditing(true);
  };

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setEditError("La geolocalización no está soportada por tu navegador");
      return;
    }
    setEditCargandoUbicacion(true);
    setEditError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEditLatitude(String(position.coords.latitude));
        setEditLongitude(String(position.coords.longitude));
        setEditCargandoUbicacion(false);
      },
      (error) => {
        console.error(error);
        setEditError("Error al obtener la ubicación. Introduce las coordenadas manualmente.");
        setEditCargandoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setEditError(null);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (userEmail) headers["x-user-email"] = userEmail;

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers,
        body: JSON.stringify({
          nombre: editName,
          bio: editBio,
          rol: perfil?.role,
          latitude: editLatitude ? parseFloat(editLatitude) : null,
          longitude: editLongitude ? parseFloat(editLongitude) : null
        }),
      });

      if (res.ok) {
        setPerfil(prev => prev ? {
          ...prev,
          name: editName,
          bio: editBio,
          latitude: editLatitude ? parseFloat(editLatitude) : null,
          longitude: editLongitude ? parseFloat(editLongitude) : null
        } : null);
        setIsEditing(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setEditError(data.error || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      setEditError("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const userEmail = session?.user?.email || wallet?.email;
  const userInicial = perfil?.name?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "?";
  const username = perfil?.email?.split("@")[0] || "";
  const roleInfo = ROLE_LABELS[perfil?.role ?? "RIZADA"] ?? ROLE_LABELS.RIZADA;

  useEffect(() => {
    if (!userEmail) { setCargando(false); return; }
    fetch(`/api/user/me?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => { if (data.id) setPerfil(data); })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [userEmail]);

  if (!userEmail) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-[#A1887F] text-sm mb-4">Inicia sesion para ver tu perfil</p>
        <Link href="/login"
          className="bg-[#8D6E63] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#6D4C41] transition-colors">
          Iniciar sesion
        </Link>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#8D6E63] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* Portada */}
      <div className="relative mb-16">
        <div className="w-full h-48 rounded-3xl bg-gradient-to-br from-[#D7CCC8] via-[#D7CCC8] to-[#BCAAA4]" />

        {/* Avatar */}
        <div className="absolute -bottom-12 left-8">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-[#8D6E63] flex items-center justify-center shadow-md">
            <span className="text-3xl font-bold text-white"
              style={{ fontFamily: "var(--font-playfair)" }}>
              {userInicial}
            </span>
          </div>
        </div>

        {/* Boton editar */}
        <div className="absolute bottom-4 right-4">
          <button 
            onClick={startEditing}
            className="bg-white border border-[#D7CCC8] text-[#4E342E] px-4 py-2 rounded-full text-xs font-medium hover:bg-[#FAF8F5] transition-colors"
          >
            Editar perfil
          </button>
        </div>
      </div>

      {/* Info perfil */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#3E2723]"
            style={{ fontFamily: "var(--font-playfair)" }}>
            {perfil?.name || username}
          </h1>
          <p className="text-sm text-[#A1887F]">@{username}</p>
          {perfil?.bio && (
            <p className="text-sm text-[#6D4C41] mt-2 max-w-md">{perfil.bio}</p>
          )}
          {!perfil?.bio && (
            <p className="text-sm text-[#BCAAA4] mt-2 italic">Sin biografia aun</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
            {perfil?.hairType && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#6D4C41]">
                Tipo {perfil.hairType.toUpperCase()}
              </span>
            )}
            {perfil?.role === "ESTILISTA" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#6D4C41]">
                📍 {perfil.latitude !== null && perfil.longitude !== null 
                  ? `${perfil.latitude.toFixed(4)}, ${perfil.longitude.toFixed(4)}` 
                  : "Sin ubicación"}
              </span>
            )}
          </div>
        </div>

        {/* Tokens */}
        <div className="bg-white rounded-2xl border border-[#D7CCC8] px-6 py-4 flex flex-col items-center min-w-32">
          <p className="text-xs text-[#A1887F] mb-1">Mis tokens</p>
          <span className="text-3xl font-bold text-[#8D6E63]"
            style={{ fontFamily: "var(--font-playfair)" }}>
            {perfil?.tokens ?? 0}
          </span>
          <span className="text-xs text-[#A1887F]">RIZO tokens</span>
          <Link href="/recompensas"
            className="mt-2 text-xs text-[#8D6E63] hover:underline">
            Ver recompensas
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 bg-white rounded-2xl border border-[#D7CCC8] p-5 mb-6">
        {[
          { label: "Publicaciones", valor: perfil?._count?.posts ?? 0 },
          { label: "Seguidores", valor: 0 },
          { label: "Resenas", valor: perfil?._count?.reviews ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-2xl font-bold text-[#3E2723]"
              style={{ fontFamily: "var(--font-playfair)" }}>
              {stat.valor}
            </p>
            <p className="text-xs text-[#A1887F] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 border border-[#D7CCC8] mb-6">
        {[
          { id: "publicaciones", label: "Publicaciones" },
          { id: "resenas", label: "Resenas" },
          { id: "guardados", label: "Guardados" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t.id ? "#8D6E63" : "transparent",
              color: tab === t.id ? "white" : "#A1887F",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Publicaciones — estado vacío real */}
      {tab === "publicaciones" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">✍️</span>
          <p className="text-sm font-semibold text-[#3E2723]">Aun no has publicado nada</p>
          <p className="text-xs text-[#A1887F] mt-1">Comparte tu experiencia en la comunidad</p>
          <Link href="/comunidad"
            className="mt-4 bg-[#8D6E63] text-white px-5 py-2 rounded-full text-xs font-medium hover:bg-[#6D4C41] transition-colors">
            Ir a la comunidad
          </Link>
        </div>
      )}

      {/* Resenas */}
      {tab === "resenas" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">⭐</span>
          <p className="text-sm font-semibold text-[#3E2723]">Aun no has escrito resenas</p>
          <p className="text-xs text-[#A1887F] mt-1">Califica un producto y gana 10 tokens</p>
        </div>
      )}

      {/* Guardados */}
      {tab === "guardados" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">🔖</span>
          <p className="text-sm font-semibold text-[#3E2723]">No tienes guardados aun</p>
          <p className="text-xs text-[#A1887F] mt-1">Guarda publicaciones y productos para verlos aqui</p>
        </div>
      )}

      {/* Modal Editar Perfil */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 border border-[#D7CCC8] max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold text-[#3E2723] mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
              Editar Perfil
            </h2>
            <form onSubmit={handleGuardar} className="flex flex-col gap-4">
              {editError && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {editError}
                </p>
              )}
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#6D4C41]">Nombre</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-3 py-2 text-sm text-[#3E2723] focus:outline-none focus:border-[#8D6E63] transition-colors" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#6D4C41]">Biografía</label>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-3 py-2 text-sm text-[#3E2723] focus:outline-none focus:border-[#8D6E63] resize-none transition-colors" 
                />
              </div>

              {perfil?.role === "ESTILISTA" && (
                <div className="border-t border-[#EFEBE9] pt-4 mt-1 flex flex-col gap-3">
                  <p className="text-xs font-bold text-[#3E2723]">Ubicación del Estilista</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-[#6D4C41]">Latitud</label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="e.g. 19.4326"
                        value={editLatitude} 
                        onChange={(e) => setEditLatitude(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-3 py-2 text-sm text-[#3E2723] focus:outline-none focus:border-[#8D6E63] transition-colors" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-[#6D4C41]">Longitud</label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="e.g. -99.1332"
                        value={editLongitude} 
                        onChange={(e) => setEditLongitude(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-3 py-2 text-sm text-[#3E2723] focus:outline-none focus:border-[#8D6E63] transition-colors" 
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={obtenerUbicacion}
                    disabled={editCargandoUbicacion}
                    className="w-full bg-[#FAF8F5] border border-[#D7CCC8] text-[#8D6E63] py-2 rounded-xl text-xs font-medium hover:bg-[#EFEBE9] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {editCargandoUbicacion ? (
                      <span className="w-3.5 h-3.5 border-2 border-[#8D6E63] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>📍</span>
                    )}
                    Usar mi ubicación actual
                  </button>
                </div>
              )}

              <div className="flex gap-2 justify-end mt-4 border-t border-[#EFEBE9] pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={guardando}
                  className="px-4 py-2 border border-[#D7CCC8] text-xs text-[#6D4C41] rounded-full hover:bg-[#FAF8F5] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || !editName.trim()}
                  className="px-5 py-2 bg-[#8D6E63] text-white text-xs font-medium rounded-full hover:bg-[#6D4C41] transition-colors disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
