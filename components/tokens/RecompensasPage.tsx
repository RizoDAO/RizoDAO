"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAccesly } from "accesly";
import Link from "next/link";
import { Copy, Check, X, ExternalLink } from "lucide-react";

type TxHistorial = {
  id: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
};

type RewardsData = {
  tokens: number;
  totalGanado: number;
  totalGastado: number;
  historial: TxHistorial[];
};

type Canje = {
  titulo: string;
  tokens: number;
  desc: string;
  type: string;
  discount: number;
};

type ModalState = "idle" | "confirming" | "loading" | "success" | "error" | "ya_activo";

const acciones = [
  { icono: "📝", titulo: "Publica en la comunidad", tokens: 5,  desc: "Comparte fotos, tips o preguntas" },
  { icono: "💬", titulo: "Comenta publicaciones",   tokens: 2,  desc: "Interactua con otros rizados" },
  { icono: "⭐", titulo: "Escribe una resena",       tokens: 10, desc: "Califica un producto que hayas usado" },
  { icono: "👤", titulo: "Completa tu perfil",       tokens: 20, desc: "Agrega foto, bio y tipo de rizo" },
  { icono: "📅", titulo: "Agenda una cita",          tokens: 15, desc: "Visita a un estilista verificado" },
];

const canjes: Canje[] = [
  { titulo: "Descuento 5%",  tokens: 100, desc: "En cualquier producto de la tienda",         type: "DESCUENTO_5",  discount: 5  },
  { titulo: "Descuento 10%", tokens: 200, desc: "En productos seleccionados",                 type: "DESCUENTO_10", discount: 10 },
  { titulo: "Descuento 20%", tokens: 400, desc: "En tu proxima cita con estilista",           type: "DESCUENTO_20", discount: 20 },
];

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const CONTRACT_ID = process.env.NEXT_PUBLIC_LOYALTY_CONTRACT_ID ?? "";
const shortContractId = CONTRACT_ID
  ? `${CONTRACT_ID.slice(0, 8)}…${CONTRACT_ID.slice(-6)}`
  : "";

export default function RecompensasPage() {
  const { data: session } = useSession();
  const { wallet } = useAccesly();
  const [tab, setTab] = useState<"historial" | "ganar" | "canjear">("historial");
  const [data, setData] = useState<RewardsData | null>(null);
  const [cargando, setCargando] = useState(true);

  // Modal de canje
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [canjeSeleccionado, setCanjeSeleccionado] = useState<Canje | null>(null);
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [codigoActivo, setCodigoActivo] = useState(""); // cuando ya_activo
  const [copiado, setCopiado] = useState(false);
  const [errorCanje, setErrorCanje] = useState("");

  const userEmail = session?.user?.email || wallet?.email;
  const meta = 500;
  const puntos = data?.tokens ?? 0;
  const porcentaje = Math.min((puntos / meta) * 100, 100);

  const fetchRewards = () => {
    if (!userEmail) return;
    fetch(`/api/user/rewards?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((d) => { if (d.tokens !== undefined) setData(d); })
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (!userEmail) { setCargando(false); return; }
    fetchRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const abrirModal = (canje: Canje) => {
    setCanjeSeleccionado(canje);
    setCodigoGenerado("");
    setCodigoActivo("");
    setErrorCanje("");
    setCopiado(false);
    setModalState("confirming");
  };

  const cerrarModal = () => {
    setModalState("idle");
    setCanjeSeleccionado(null);
  };

  const handleCanjear = async () => {
    if (!canjeSeleccionado || !userEmail) return;
    setModalState("loading");
    try {
      const res = await fetch("/api/tokens/canjear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canjeType: canjeSeleccionado.type }),
      });
      const json = await res.json();

      if (res.status === 401) {
        setErrorCanje("Inicia sesión con tu correo para canjear tus tokens.");
        setModalState("error");
        return;
      }

      if (res.status === 409) {
        // Ya tiene un código activo
        setCodigoActivo(json.code ?? "");
        setModalState("ya_activo");
        return;
      }

      if (!json.success) {
        setErrorCanje(json.error || "Error al canjear");
        setModalState("error");
        return;
      }

      setCodigoGenerado(json.code);
      setModalState("success");
      fetchRewards(); // refrescar balance
    } catch {
      setErrorCanje("Error de conexion. Intenta de nuevo.");
      setModalState("error");
    }
  };

  const copiarCodigo = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // fallback silencioso
    }
  };

  if (!userEmail) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-[#A1887F] text-sm mb-4">Inicia sesion para ver tus puntos RIZO</p>
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

      {/* Header balance */}
      <div className="bg-white rounded-3xl p-8 border border-[#D7CCC8] mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-[#A1887F] uppercase tracking-wider mb-1">Mis puntos RIZO</p>
            <div className="flex items-end gap-3">
              <span className="text-6xl font-bold text-[#8D6E63]"
                style={{ fontFamily: "var(--font-playfair)" }}>
                {puntos}
              </span>
              <span className="text-sm text-[#A1887F] mb-2">puntos</span>
            </div>
            <p className="text-xs text-[#A1887F] mt-2">
              {puntos >= meta
                ? <span className="text-[#0F6E56] font-semibold">¡Ya alcanzaste el nivel Pro! 🎉</span>
                : <>Te faltan <span className="text-[#8D6E63] font-semibold">{meta - puntos} puntos</span> para tu proximo descuento</>
              }
            </p>
          </div>

          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs text-[#A1887F] mb-2">
              <span>Progreso al siguiente nivel</span>
              <span>{puntos}/{meta}</span>
            </div>
            <div className="h-3 rounded-full bg-[#FAF8F5] overflow-hidden">
              <div className="h-full rounded-full bg-[#8D6E63] transition-all"
                style={{ width: `${porcentaje}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-[#8D6E63] font-medium">Nivel Rizo</span>
              <span className="text-[#A1887F]">Nivel Pro</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#FAF8F5]">
          {[
            { label: "Puntos ganados",  valor: data?.totalGanado ?? 0 },
            { label: "Puntos gastados", valor: data?.totalGastado ?? 0 },
            { label: "Actividades",     valor: data?.historial?.length ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-bold text-[#3E2723]"
                style={{ fontFamily: "var(--font-playfair)" }}>
                {stat.valor}
              </p>
              <p className="text-xs text-[#A1887F] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 border border-[#D7CCC8] mb-6">
        {[
          { id: "historial", label: "Historial" },
          { id: "ganar",     label: "Como ganar" },
          { id: "canjear",   label: "Canjear" },
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

      {/* Historial */}
      {tab === "historial" && (
        <>
          {(!data?.historial || data.historial.length === 0) ? (
            <div className="bg-white rounded-2xl border border-[#D7CCC8] p-12 text-center">
              <span className="text-4xl mb-4 block">🪙</span>
              <p className="text-sm font-semibold text-[#3E2723]">Sin actividad aun</p>
              <p className="text-xs text-[#A1887F] mt-1">Participa en la comunidad para ganar puntos</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#D7CCC8] overflow-hidden">
              {data.historial.map((item, i) => {
                const esGanado = item.amount > 0;
                return (
                  <div key={item.id}
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: i < data.historial.length - 1 ? "1px solid #FAF8F5" : "none" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: esGanado ? "#E1F5EE" : "#FBEAF2" }}>
                        <span className="text-xs font-bold"
                          style={{ color: esGanado ? "#0F6E56" : "#993556" }}>
                          {esGanado ? "+" : "-"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-[#3E2723]">{item.reason}</p>
                        <p className="text-xs text-[#A1887F]">{formatFecha(item.createdAt)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold"
                      style={{ color: esGanado ? "#0F6E56" : "#8D6E63" }}>
                      {esGanado ? "+" : ""}{item.amount} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Como ganar */}
      {tab === "ganar" && (
        <div className="flex flex-col gap-3">
          {acciones.map((accion) => (
            <div key={accion.titulo}
              className="bg-white rounded-2xl border border-[#D7CCC8] p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-2xl">
                  {accion.icono}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#3E2723]">{accion.titulo}</p>
                  <p className="text-xs text-[#A1887F] mt-0.5">{accion.desc}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold text-[#8D6E63]"
                  style={{ fontFamily: "var(--font-playfair)" }}>
                  +{accion.tokens}
                </span>
                <span className="text-xs text-[#A1887F]">puntos</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Canjear */}
      {tab === "canjear" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {canjes.map((canje) => {
            const puedesCanjear = puntos >= canje.tokens;
            return (
              <div key={canje.titulo}
                className="bg-white rounded-2xl border border-[#D7CCC8] p-6 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-[#3E2723]"
                    style={{ fontFamily: "var(--font-playfair)" }}>
                    {canje.titulo}
                  </h3>
                  <span className="text-sm font-bold text-[#8D6E63] bg-[#EFEBE9] px-3 py-1 rounded-full">
                    {canje.tokens} pts
                  </span>
                </div>
                <p className="text-xs text-[#A1887F]">{canje.desc}</p>
                <button
                  onClick={() => puedesCanjear && abrirModal(canje)}
                  disabled={!puedesCanjear}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: puedesCanjear ? "#8D6E63" : "#FAF8F5",
                    color: puedesCanjear ? "white" : "#BCAAA4",
                    cursor: puedesCanjear ? "pointer" : "not-allowed",
                  }}>
                  {puedesCanjear ? "Canjear ahora" : `Faltan ${canje.tokens - puntos} puntos`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Powered by Stellar */}
      <StellarBadge />

      {/* ── Modal de canje ────────────────────────────────────────────────────── */}
      {modalState !== "idle" && canjeSeleccionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5">

            {/* Encabezado */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#3E2723]"
                style={{ fontFamily: "var(--font-playfair)" }}>
                {modalState === "success" ? "¡Descuento canjeado!" :
                 modalState === "ya_activo" ? "Descuento activo" :
                 "Confirmar canje"}
              </h3>
              {modalState !== "loading" && (
                <button onClick={cerrarModal}
                  className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center hover:bg-[#EFEBE9] transition-colors">
                  <X className="w-4 h-4 text-[#6D4C41]" />
                </button>
              )}
            </div>

            {/* Estado: confirmando */}
            {modalState === "confirming" && (
              <>
                <div className="bg-[#FAF8F5] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A1887F]">Descuento</span>
                    <span className="text-sm font-semibold text-[#3E2723]">{canjeSeleccionado.titulo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A1887F]">Costo</span>
                    <span className="text-sm font-bold text-[#8D6E63]">-{canjeSeleccionado.tokens} pts</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#D7CCC8] pt-3">
                    <span className="text-sm text-[#A1887F]">Balance restante</span>
                    <span className="text-sm font-bold text-[#3E2723]">{puntos - canjeSeleccionado.tokens} pts</span>
                  </div>
                </div>
                <p className="text-xs text-[#A1887F] text-center">
                  Válido por 30 días · Un código por tipo de descuento
                </p>
                <div className="flex gap-3">
                  <button onClick={cerrarModal}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold border-2 border-[#D7CCC8] text-[#6D4C41] hover:border-[#8D6E63] transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleCanjear}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#8D6E63] text-white hover:bg-[#6D4C41] transition-colors">
                    Confirmar canje
                  </button>
                </div>
              </>
            )}

            {/* Estado: cargando */}
            {modalState === "loading" && (
              <div className="py-8 flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-[#8D6E63] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#A1887F]">Generando tu codigo...</p>
              </div>
            )}

            {/* Estado: éxito */}
            {modalState === "success" && (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm text-[#6D4C41]">{canjeSeleccionado.titulo}</p>
                </div>

                <div className="bg-[#FAF8F5] rounded-2xl p-4 text-center space-y-2">
                  <p className="text-xs text-[#A1887F]">Tu código de descuento</p>
                  <p className="text-2xl font-bold text-[#3E2723] font-mono tracking-widest">
                    {codigoGenerado}
                  </p>
                  <p className="text-xs text-[#A1887F]">Válido por 30 días</p>
                </div>

                <button
                  onClick={() => copiarCodigo(codigoGenerado)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border-2 border-[#8D6E63] text-[#8D6E63] hover:bg-[#EFEBE9] transition-colors"
                >
                  {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiado ? "¡Copiado!" : "Copiar código"}
                </button>

                <div className="flex gap-3">
                  <button onClick={cerrarModal}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold border-2 border-[#D7CCC8] text-[#6D4C41] hover:border-[#8D6E63] transition-colors">
                    Cerrar
                  </button>
                  <Link href="/tienda"
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#8D6E63] text-white hover:bg-[#6D4C41] transition-colors text-center">
                    Usar en tienda
                  </Link>
                </div>
              </>
            )}

            {/* Estado: ya activo */}
            {modalState === "ya_activo" && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-amber-700">Ya tienes este descuento activo</p>
                  <p className="text-xs text-amber-600">Usa este código en el checkout antes de canjear uno nuevo:</p>
                  <p className="text-lg font-bold text-[#3E2723] font-mono tracking-widest text-center py-1">
                    {codigoActivo}
                  </p>
                </div>

                <button
                  onClick={() => copiarCodigo(codigoActivo)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border-2 border-[#8D6E63] text-[#8D6E63] hover:bg-[#EFEBE9] transition-colors"
                >
                  {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiado ? "¡Copiado!" : "Copiar código"}
                </button>

                <div className="flex gap-3">
                  <button onClick={cerrarModal}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold border-2 border-[#D7CCC8] text-[#6D4C41] hover:border-[#8D6E63] transition-colors">
                    Cerrar
                  </button>
                  <Link href="/tienda"
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#8D6E63] text-white hover:bg-[#6D4C41] transition-colors text-center">
                    Ir a tienda
                  </Link>
                </div>
              </>
            )}

            {/* Estado: error */}
            {modalState === "error" && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-red-700">No se pudo completar el canje</p>
                  <p className="text-xs text-red-600 mt-1">{errorCanje}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={cerrarModal}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold border-2 border-[#D7CCC8] text-[#6D4C41] hover:border-[#8D6E63] transition-colors">
                    Cancelar
                  </button>
                  <button onClick={() => setModalState("confirming")}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#8D6E63] text-white hover:bg-[#6D4C41] transition-colors">
                    Intentar de nuevo
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

function StellarBadge() {
  return (
    <div className="mt-8 border border-[#D7CCC8] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#EFEBE9] flex items-center justify-center text-base">
          ⚡
        </div>
        <div>
          <p className="text-xs font-semibold text-[#6D4C41]">Powered by Stellar</p>
          <p className="text-xs text-[#A1887F] mt-0.5">
            Tus puntos están registrados en Stellar blockchain
          </p>
          {shortContractId && (
            <p className="text-xs text-[#BCAAA4] font-mono mt-0.5">
              Smart contract: {shortContractId}
            </p>
          )}
        </div>
      </div>
      {CONTRACT_ID && (
        <a
          href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#8D6E63] hover:underline shrink-0 flex items-center gap-1"
        >
          Ver contrato en Stellar Expert
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
