"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Gift, ExternalLink } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

type ResultadoPago = {
  txHash: string;
  txOnChain: boolean;
  producto: string;
  precioMXN: number;
  precioOriginal?: number;
  descuentoAplicado?: number;
  tokens: number;
};

const STELLAR_EXPERT_URL = "https://stellar.expert/explorer/testnet/tx";
const CONTRACT_ID = process.env.NEXT_PUBLIC_LOYALTY_CONTRACT_ID ?? "";

export default function PagoExitosoPage() {
  const router = useRouter();
  const pagoExitosoState = useCartStore((state) => state.pagoExitoso);
  const [resultado, setResultado] = useState<ResultadoPago | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && pagoExitosoState) {
      const data = { ...pagoExitosoState };
      // Compatibilidad con datos guardados antes del cambio (precioUSDC)
      if (!data.precioMXN && data.precioUSDC) {
        data.precioMXN = Math.round(data.precioUSDC * 19);
      }
      setResultado(data);
    }
  }, [mounted, pagoExitosoState]);

  useEffect(() => {

    // Confetti café/beige
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("canvas-confetti").then((mod: any) => {
      const fire = mod.default ?? mod;
      const end = Date.now() + 3000;
      const frame = () => {
        if (cancelled || Date.now() > end) return;
        fire({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#8D6E63", "#BCAAA4", "#D7CCC8", "#EFEBE9"] });
        fire({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#8D6E63", "#BCAAA4", "#D7CCC8", "#EFEBE9"] });
        requestAnimationFrame(frame);
      };
      frame();
    });

    return () => { cancelled = true; };
  }, []);

  const esHashReal = resultado?.txOnChain === true && /^[0-9a-fA-F]{64}$/.test(resultado?.txHash ?? "");

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">

        {/* Icono de exito */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-[#8D6E63] to-[#BCAAA4] rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Mensaje principal */}
        <div className="space-y-1">
          <h1
            className="text-3xl font-bold text-[#3E2723]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            ¡Compra completada!
          </h1>
          <p className="text-[#6D4C41]">
            Tu pedido fue confirmado al instante
          </p>
        </div>

        {/* Detalles de la compra */}
        <div className="bg-white rounded-2xl border border-[#D7CCC8] p-6 text-left space-y-3">
          <h3
            className="text-base font-semibold text-[#3E2723]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Detalles de tu compra
          </h3>

          {resultado?.producto && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-[#A1887F] shrink-0">Producto</span>
              <span className="text-sm font-medium text-[#3E2723] text-right line-clamp-2">
                {resultado.producto}
              </span>
            </div>
          )}

          {resultado?.descuentoAplicado && resultado.descuentoAplicado > 0 && resultado.precioOriginal ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#A1887F]">Precio original</span>
                <span className="text-sm text-[#A1887F] line-through">
                  ${resultado.precioOriginal.toLocaleString("es-MX")} MXN
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 font-medium">
                  Descuento aplicado ({resultado.descuentoAplicado}%)
                </span>
                <span className="text-sm text-green-600 font-medium">
                  -${(resultado.precioOriginal - resultado.precioMXN).toLocaleString("es-MX")} MXN
                </span>
              </div>
            </>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A1887F]">Pagaste</span>
            <span className="text-xl font-bold text-[#8D6E63]">
              ${(resultado?.precioMXN ?? 0).toLocaleString("es-MX")} MXN
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A1887F]">Comision</span>
            <span className="text-sm font-medium text-green-600">$0.00</span>
          </div>
        </div>

        {/* Puntos ganados */}
        <div className="bg-gradient-to-br from-[#EFEBE9] to-[#D7CCC8] rounded-2xl p-6 border-2 border-[#BCAAA4]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-[#8D6E63]" />
            <h3
              className="text-base font-semibold text-[#3E2723]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              ¡Ganaste recompensas!
            </h3>
          </div>
          <p
            className="text-5xl font-bold text-[#8D6E63] mb-1"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            +{resultado?.tokens ?? 100}
          </p>
          <p className="text-sm text-[#6D4C41] font-medium">puntos RIZO</p>
          <div className="mt-3 pt-3 border-t border-[#BCAAA4]/50 grid grid-cols-2 gap-2 text-xs text-[#6D4C41]">
            <div className="bg-white/50 rounded-lg p-2">
              <p className="font-semibold">500 puntos</p>
              <p className="text-[#A1887F]">10% de descuento</p>
            </div>
            <div className="bg-white/50 rounded-lg p-2">
              <p className="font-semibold">1,000 puntos</p>
              <p className="text-[#A1887F]">Envio gratis</p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/recompensas")}
            className="w-full bg-[#8D6E63] text-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-[#6D4C41] transition-colors"
          >
            Ver mis puntos RIZO
          </button>
          <button
            onClick={() => router.push("/tienda")}
            className="w-full border-2 border-[#D7CCC8] text-[#6D4C41] py-3.5 rounded-2xl text-sm font-semibold hover:border-[#8D6E63] hover:text-[#8D6E63] transition-colors"
          >
            Seguir comprando
          </button>
        </div>

        <p className="text-xs text-[#A1887F]">
          Recibirás un correo con los detalles de tu compra
        </p>

        {/* Transparencia blockchain */}
        <div className="w-full border border-[#D7CCC8] rounded-2xl p-4 text-left space-y-2.5">
          <p className="text-xs font-semibold text-[#A1887F] uppercase tracking-wider">
            🔗 Transparencia blockchain
          </p>
          <p className="text-xs text-[#BCAAA4]">
            Transacción verificada en Stellar Network
          </p>
          {esHashReal && resultado?.txHash ? (
            <a
              href={`${STELLAR_EXPERT_URL}/${resultado.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group"
            >
              <span className="text-xs text-[#A1887F] font-mono truncate max-w-[200px]">
                {resultado.txHash.slice(0, 8)}...{resultado.txHash.slice(-8)}
              </span>
              <span className="flex items-center gap-1 text-xs text-[#8D6E63] group-hover:underline shrink-0 ml-2">
                Ver transacción <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          ) : (
            <p className="text-xs text-[#BCAAA4] italic">Hash pendiente de confirmación on-chain</p>
          )}
          {CONTRACT_ID && (
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group"
            >
              <span className="text-xs text-[#A1887F] font-mono">
                Smart contract: {CONTRACT_ID.slice(0, 8)}…{CONTRACT_ID.slice(-6)}
              </span>
              <span className="flex items-center gap-1 text-xs text-[#8D6E63] group-hover:underline shrink-0 ml-2">
                Ver contrato <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
