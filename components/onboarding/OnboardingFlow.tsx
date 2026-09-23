"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccesly } from "accesly";
import { useSession } from "next-auth/react";
import { saveGuestProfile, clearGuestProfile } from "@/lib/guestCurlProfile";

const tiposCabello = [
  { id: "2a", titulo: "2A — Ondulado suave", desc: "Ondas ligeras en forma de S, cabello fino" },
  { id: "2b", titulo: "2B — Ondulado definido", desc: "Ondas mas marcadas, algo de volumen" },
  { id: "3a", titulo: "3A — Rizado amplio", desc: "Rizos grandes y definidos, muy elasticos" },
  { id: "3b", titulo: "3B — Rizado compacto", desc: "Rizos medianos con mucho volumen" },
  { id: "3c", titulo: "3C — Muy rizado", desc: "Rizos apretados tipo sacacorchos" },
  { id: "4a", titulo: "4A — Afro suave", desc: "Rizos muy apretados en forma de S" },
  { id: "4b", titulo: "4B — Afro angular", desc: "Patron en zigzag, muy denso" },
  { id: "4c", titulo: "4C — Afro compacto", desc: "El rizo mas apretado, maximo volumen" },
];

const roles = [
  { id: "rizada", titulo: "Soy Rizada/o", desc: "Quiero encontrar productos, conectar con la comunidad y ganar tokens.", color: "#FBEAF2" },
  { id: "marca", titulo: "Soy una Marca", desc: "Quiero publicar mis productos y conectar con mi comunidad.", color: "#EEEDFE" },
  { id: "estilista", titulo: "Soy Estilista", desc: "Quiero ofrecer mis servicios y aparecer en busquedas.", color: "#E1F5EE" },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const { wallet } = useAccesly();
  const { data: session, status } = useSession();
  const userEmail = wallet?.email || session?.user?.email || null;
  const [paso, setPaso] = useState(1);
  const [rol, setRol] = useState("");
  const [tipoCabello, setTipoCabello] = useState("");
  const [nombre, setNombre] = useState("");
  const [bio, setBio] = useState("");
  const [guardando, setGuardando] = useState(false);

  const totalPasos = rol === "rizada" ? 3 : 2;

  const handleContinuar = () => {
    if (paso === 1 && rol !== "rizada") {
      setPaso(3);
    } else {
      setPaso(paso + 1);
    }
  };

  const handleAtras = () => {
    if (paso === 3 && rol !== "rizada") {
      setPaso(1);
    } else {
      setPaso(paso - 1);
    }
  };

  const pasoActual = paso === 1 ? 1 : rol === "rizada" ? paso : paso === 3 ? 2 : paso;

  const continuarDeshabilitado =
    paso === 1 ? !rol :
    paso === 2 ? !tipoCabello :
    !nombre;

  const handleEmpezar = async () => {
    if (!nombre.trim()) return;

    // Collect the completed profile
    const profileData = { nombre, bio, rol, tipoCabello };

    // ── Guest path: no authenticated user ─────────────────────────────────────
    // Save to localStorage so the data survives until they register or log in.
    const email = userEmail;
    const userId =
      typeof window !== "undefined" ? localStorage.getItem("rizoUserId") : null;

    if (!email && !userId) {
      saveGuestProfile(profileData);
      // Redirect to the community page; the guest will see their profile
      // data applied to their account once they sign up or log in.
      router.push("/comunidad");
      return;
    }

    // ── Authenticated path: persist directly to DB ─────────────────────────────
    setGuardando(true);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (email)  headers["x-user-email"] = email;
    if (userId) headers["x-user-id"]    = userId;

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers,
        body: JSON.stringify(profileData),
      });
      await res.json().catch(() => ({}));
      // If there was a guest profile stored from an earlier guest session,
      // clear it now — the authoritative data is in the DB.
      clearGuestProfile();
      router.push("/comunidad");
    } catch (error) {
      console.error("[Onboarding] error de red:", error);
      router.push("/comunidad");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2 mb-8">
        <span className="text-[#8D6E63] text-xl">o</span>
        <span className="text-2xl font-bold text-[#3E2723]" style={{ fontFamily: "var(--font-playfair)" }}>RIZO</span>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-3xl p-8 border border-[#D7CCC8] shadow-sm">

        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalPasos }).map((_, i) => {
            const n = i + 1;
            const activo = pasoActual >= n;
            return (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: activo ? "#8D6E63" : "#FAF8F5", color: activo ? "white" : "#A1887F" }}>
                  {pasoActual > n ? "v" : n}
                </div>
                {n < totalPasos && (
                  <div className="flex-1 h-0.5 rounded-full"
                    style={{ backgroundColor: pasoActual > n ? "#8D6E63" : "#D7CCC8" }}>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {paso === 1 && (
          <>
            <h1 className="text-2xl font-bold text-[#3E2723] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
              Como quieres usar RIZO?
            </h1>
            <p className="text-sm text-[#A1887F] mb-6">Paso 1 de {totalPasos || 2}</p>
            <div className="flex flex-col gap-3">
              {roles.map((r) => (
                <button key={r.id} onClick={() => setRol(r.id)}
                  className="flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all"
                  style={{ borderColor: rol === r.id ? "#8D6E63" : "#D7CCC8", backgroundColor: rol === r.id ? "#EFEBE9" : "white" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: r.color }}>
                    {r.id === "rizada" ? "R" : r.id === "marca" ? "M" : "E"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#3E2723]">{r.titulo}</p>
                    <p className="text-xs text-[#A1887F] mt-1">{r.desc}</p>
                  </div>
                  {rol === r.id && <span className="ml-auto text-[#8D6E63] text-lg font-bold">v</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {paso === 2 && rol === "rizada" && (
          <>
            <h1 className="text-2xl font-bold text-[#3E2723] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
              Cual es tu tipo de cabello?
            </h1>
            <p className="text-sm text-[#A1887F] mb-4">Paso 2 de 3</p>
            <div className="w-full rounded-2xl overflow-hidden mb-6 border border-[#D7CCC8]">
              <img src="/TipoRizo.jpeg" alt="Tipos de rizo" className="w-full object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {tiposCabello.map((tipo) => (
                <button key={tipo.id} onClick={() => setTipoCabello(tipo.id)}
                  className="flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all"
                  style={{ borderColor: tipoCabello === tipo.id ? "#8D6E63" : "#D7CCC8", backgroundColor: tipoCabello === tipo.id ? "#EFEBE9" : "white" }}>
                  <div>
                    <p className="text-xs font-semibold text-[#3E2723]">{tipo.titulo}</p>
                    <p className="text-xs text-[#A1887F] mt-0.5">{tipo.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <h1 className="text-2xl font-bold text-[#3E2723] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
              Cuentanos sobre ti
            </h1>
            <p className="text-sm text-[#A1887F] mb-6">Paso {totalPasos} de {totalPasos}</p>
            <div className="flex flex-col gap-4">
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 rounded-full bg-[#D7CCC8] flex items-center justify-center cursor-pointer hover:bg-[#D7CCC8] transition-colors">
                  <span className="text-sm text-[#A1887F]">foto</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6D4C41]">Nombre o apodo</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Como te llamas?"
                  className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder-[#BCAAA4] focus:outline-none focus:border-[#8D6E63] transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6D4C41]">Bio corta</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuentanos sobre tu cabello..." rows={3}
                  className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder-[#BCAAA4] focus:outline-none focus:border-[#8D6E63] resize-none transition-colors" />
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between mt-8">
          {paso > 1 ? (
            <button onClick={handleAtras} className="text-sm text-[#A1887F] hover:text-[#8D6E63] transition-colors">
              Atras
            </button>
          ) : <div />}

          {paso < 3 ? (
            <button onClick={handleContinuar} disabled={continuarDeshabilitado}
              className="bg-[#8D6E63] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#6D4C41] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Continuar
            </button>
          ) : (
            <button onClick={handleEmpezar} disabled={!nombre.trim() || guardando}
              className="bg-[#8D6E63] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#6D4C41] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {guardando ? "Guardando..." : "Empezar"}
            </button>
          )}
        </div>

      </div>
    </div>
  ); 
}