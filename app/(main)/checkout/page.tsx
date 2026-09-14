"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAccesly } from "accesly";
import { ArrowLeft, ShoppingBag, AlertCircle, CreditCard, X, Wallet } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

const MXN_PER_USDC = 19;

type Producto = {
  id: string;
  nombre: string;
  marca: string;
  precioMXN: number;
  precioUSDC: number;
  imagen: string;
  tokens: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { wallet, connect } = useAccesly();

  const cartProducto = useCartStore((state) => state.productoSeleccionado);
  const setPagoExitoso = useCartStore((state) => state.setPagoExitoso);
  const clearCart = useCartStore((state) => state.clearCart);

  const [producto, setProducto] = useState<Producto | null>(null);
  const [saldoUSDC, setSaldoUSDC] = useState(0);
  const [saldoSimulado, setSaldoSimulado] = useState(0);
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const [modalRecarga, setModalRecarga] = useState(false);
  const [montoRecarga, setMontoRecarga] = useState(200);
  const [recargado, setRecargado] = useState(false);
  const [descuento, setDescuento] = useState(0); // loyalty tier: 0, 10 o 15
  const [codigoInput, setCodigoInput] = useState("");
  const [codigoAplicado, setCodigoAplicado] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [validandoCodigo, setValidandoCodigo] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);

  const userEmail = session?.user?.email || wallet?.email;
  const estaLogueado = !!userEmail;

  // Descuento efectivo: el mayor entre loyalty tier y código canjeado
  const descuentoEfectivo = Math.max(descuento, codigoAplicado?.discount ?? 0);
  const fuenteDescuento = codigoAplicado && codigoAplicado.discount >= descuento
    ? `Código ${codigoAplicado.code}`
    : descuento > 0 ? "Descuento lealtad RIZO" : "";

  // Saldo total en MXN
  const saldoMXN = Math.round(saldoUSDC * MXN_PER_USDC) + saldoSimulado;
  const precioConDescuento = producto
    ? Math.round(producto.precioMXN * (1 - descuentoEfectivo / 100))
    : 0;
  const tienesSaldo = producto ? saldoMXN >= precioConDescuento : false;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (cartProducto) {
        setProducto(cartProducto);
      } else {
        router.replace("/tienda");
      }
    }
  }, [mounted, cartProducto, router]);

  // Cargar saldo interno del usuario
  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/user/balances?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => { if (typeof data.usdc === "number") setSaldoUSDC(data.usdc); })
      .catch(() => {});
  }, [userEmail]);

  // Obtener descuento por lealtad desde el contrato Soroban
  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/loyalty/discount?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => { if (typeof data.discount === "number") setDescuento(data.discount); })
      .catch(() => {});
  }, [userEmail]);

  const handleSimularRecarga = () => {
    setSaldoSimulado((prev) => prev + montoRecarga);
    setRecargado(true);
    setTimeout(() => {
      setModalRecarga(false);
      setRecargado(false);
    }, 1500);
  };

  const handleAplicarCodigo = async () => {
    const code = codigoInput.trim().toUpperCase();
    if (!code) return;
    setValidandoCodigo(true);
    setErrorCodigo(null);
    try {
      const res = await fetch(`/api/discount/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!data.valid) {
        setErrorCodigo(data.error || "Código inválido");
        setCodigoAplicado(null);
      } else {
        setCodigoAplicado({ code, discount: data.discount, description: data.description });
        setCodigoInput("");
      }
    } catch {
      setErrorCodigo("Error al validar el código");
    } finally {
      setValidandoCodigo(false);
    }
  };

  const handlePagar = async () => {
    if (!userEmail || !producto) return;
    setPagando(true);
    setErrorPago(null);

    try {
      const res = await fetch("/api/pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          productName: producto.nombre,
          precioUSDC: producto.precioUSDC,
          tokensGanados: producto.tokens,
          paymentAsset: "USDC",
          precioXLM: 0,
          discountCode: codigoAplicado?.code ?? null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorPago(data.error || "Error al procesar el pago");
        return;
      }

      setPagoExitoso({
        txHash: data.txHash,
        txOnChain: data.txOnChain,
        producto: producto.nombre,
        precioMXN: precioConDescuento,
        precioOriginal: producto.precioMXN,
        descuentoAplicado: descuentoEfectivo,
        tokens: data.tokensGanados,
      });
      clearCart();

      router.push("/pago-exitoso");
    } catch {
      setErrorPago("Error de conexion. Intenta de nuevo.");
    } finally {
      setPagando(false);
    }
  };

  if (!producto) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">

      {/* Header */}
      <header className="bg-white border-b border-[#D7CCC8] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full border border-[#D7CCC8] flex items-center justify-center hover:bg-[#EFEBE9] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#6D4C41]" />
          </button>
          <h1
            className="text-lg font-semibold text-[#3E2723]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Confirmar compra
          </h1>
        </div>
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">

        {/* Resumen del producto */}
        <div className="bg-white rounded-2xl border border-[#D7CCC8] p-5">
          <h3
            className="text-base font-semibold text-[#3E2723] mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Resumen de compra
          </h3>
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-xl bg-[#EFEBE9] overflow-hidden flex-shrink-0">
              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' fill='%23EFEBE9'%3E%3Crect width='96' height='96'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='28'%3E%F0%9F%A7%B4%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#A1887F] mb-0.5">{producto.marca}</p>
              <h4
                className="text-sm font-semibold text-[#3E2723] leading-snug mb-2"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {producto.nombre}
              </h4>
              <p className="text-xl font-bold text-[#8D6E63]">${producto.precioMXN} MXN</p>
            </div>
          </div>
        </div>

        {/* Puntos que ganará */}
        <div className="bg-gradient-to-br from-[#EFEBE9] to-[#D7CCC8] rounded-2xl p-5 border border-[#BCAAA4]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6D4C41] mb-1">Ganarás en esta compra</p>
              <p
                className="text-2xl font-bold text-[#8D6E63]"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                +{producto.tokens} puntos RIZO
              </p>
              <p className="text-xs text-[#A1887F] mt-0.5">
                500 puntos = 10% · 1,000 puntos = envio gratis
              </p>
            </div>
            <span className="text-4xl">🎁</span>
          </div>
        </div>

        {/* Código de descuento */}
        {estaLogueado && (
          <div className="bg-white rounded-2xl border border-[#D7CCC8] p-5 space-y-3">
            <h3
              className="text-sm font-semibold text-[#3E2723]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Código de descuento
            </h3>

            {codigoAplicado ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    {codigoAplicado.discount}% aplicado
                  </p>
                  <p className="text-xs text-green-600 font-mono">{codigoAplicado.code}</p>
                </div>
                <button
                  onClick={() => setCodigoAplicado(null)}
                  className="text-xs text-[#A1887F] hover:text-[#6D4C41] underline"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codigoInput}
                  onChange={(e) => { setCodigoInput(e.target.value.toUpperCase()); setErrorCodigo(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAplicarCodigo()}
                  placeholder="RIZO-XXXXXX"
                  className="flex-1 border border-[#D7CCC8] rounded-xl px-4 py-2.5 text-sm font-mono text-[#3E2723] placeholder-[#D7CCC8] focus:outline-none focus:border-[#8D6E63] bg-[#FAF8F5]"
                />
                <button
                  onClick={handleAplicarCodigo}
                  disabled={!codigoInput.trim() || validandoCodigo}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#8D6E63] text-white hover:bg-[#6D4C41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validandoCodigo ? "..." : "Aplicar"}
                </button>
              </div>
            )}

            {errorCodigo && (
              <p className="text-xs text-red-600">{errorCodigo}</p>
            )}
          </div>
        )}

        {/* Saldo y método de pago */}
        {estaLogueado && (
          <div className="bg-white rounded-2xl border border-[#D7CCC8] p-5 space-y-4">
            <h3
              className="text-sm font-semibold text-[#3E2723]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Metodo de pago
            </h3>

            {/* Saldo RIZO */}
            <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
              tienesSaldo ? "border-[#8D6E63] bg-[#EFEBE9]" : "border-[#D7CCC8] bg-[#FAF8F5]"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8D6E63] flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#3E2723]">Saldo RIZO</p>
                  <p className={`text-xs mt-0.5 font-medium ${tienesSaldo ? "text-green-600" : "text-[#A1887F]"}`}>
                    Disponible: ${saldoMXN.toLocaleString("es-MX")} MXN
                  </p>
                </div>
              </div>
              {!tienesSaldo && (
                <button
                  onClick={() => setModalRecarga(true)}
                  className="text-xs font-semibold text-[#8D6E63] bg-[#EFEBE9] px-3 py-1.5 rounded-full hover:bg-[#D7CCC8] transition-colors"
                >
                  Recargar
                </button>
              )}
            </div>

            {!tienesSaldo && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-700">Saldo insuficiente</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Necesitas ${producto.precioMXN} MXN. Recarga tu saldo para continuar.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desglose del total */}
        <div className="bg-white rounded-2xl border border-[#D7CCC8] p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#A1887F]">Subtotal</span>
              <span className="text-sm font-medium text-[#3E2723]">${producto.precioMXN} MXN</span>
            </div>
            {descuentoEfectivo > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 font-medium">
                  {fuenteDescuento} ({descuentoEfectivo}%)
                </span>
                <span className="text-sm font-medium text-green-600">
                  -${producto.precioMXN - precioConDescuento} MXN
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#A1887F]">Comision</span>
              <span className="text-sm font-medium text-green-600">$0.00</span>
            </div>
            <div className="border-t border-[#EFEBE9] pt-3 flex items-center justify-between">
              <span className="font-semibold text-[#3E2723]">Total</span>
              <div className="text-right">
                {descuentoEfectivo > 0 && (
                  <p className="text-xs text-[#A1887F] line-through">${producto.precioMXN} MXN</p>
                )}
                <span
                  className="text-xl font-bold text-[#8D6E63]"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  ${precioConDescuento} MXN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error de pago */}
        {errorPago && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{errorPago}</p>
          </div>
        )}

        {/* Botón principal */}
        {!estaLogueado ? (
          <button
            onClick={connect}
            className="w-full flex items-center justify-center gap-2 bg-[#8D6E63] text-white py-4 rounded-2xl text-base font-semibold hover:bg-[#6D4C41] transition-colors"
          >
            Inicia sesion para comprar
          </button>
        ) : (
          <>
            <button
              onClick={handlePagar}
              disabled={pagando || !tienesSaldo}
              className="w-full flex items-center justify-center gap-2 bg-[#8D6E63] text-white py-4 rounded-2xl text-base font-semibold hover:bg-[#6D4C41] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pagando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Confirmar compra
                </>
              )}
            </button>

            {!tienesSaldo && (
              <button
                onClick={() => setModalRecarga(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-[#8D6E63] text-[#8D6E63] py-4 rounded-2xl text-base font-semibold hover:bg-[#EFEBE9] transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Recargar saldo
              </button>
            )}
          </>
        )}

        <p className="text-xs text-center text-[#A1887F]">
          Pago seguro e instantaneo · Sin comisiones adicionales
        </p>
      </div>

      {/* Modal Recargar Saldo */}
      {modalRecarga && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5">

            <div className="flex items-center justify-between">
              <h3
                className="text-lg font-semibold text-[#3E2723]"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Recargar saldo
              </h3>
              <button
                onClick={() => setModalRecarga(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center hover:bg-[#EFEBE9] transition-colors"
              >
                <X className="w-4 h-4 text-[#6D4C41]" />
              </button>
            </div>

            {/* Montos predefinidos */}
            <div>
              <p className="text-xs text-[#A1887F] mb-3">Selecciona el monto a recargar:</p>
              <div className="grid grid-cols-4 gap-2">
                {[100, 200, 500, 1000].map((monto) => (
                  <button
                    key={monto}
                    onClick={() => setMontoRecarga(monto)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      montoRecarga === monto
                        ? "border-[#8D6E63] bg-[#EFEBE9] text-[#3E2723]"
                        : "border-[#D7CCC8] text-[#6D4C41] hover:border-[#8D6E63]"
                    }`}
                  >
                    ${monto}
                  </button>
                ))}
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="space-y-2">
              <p className="text-xs text-[#A1887F] mb-2">Metodo de pago:</p>

              {[
                { icono: "💳", nombre: "Tarjeta Visa / Mastercard" },
                { icono: "🏪", nombre: "OXXO Pay" },
                { icono: "🏦", nombre: "Transferencia SPEI" },
              ].map((metodo) => (
                <div
                  key={metodo.nombre}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#D7CCC8] bg-[#FAF8F5]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{metodo.icono}</span>
                    <span className="text-sm text-[#6D4C41]">{metodo.nombre}</span>
                  </div>
                  <span className="text-xs font-medium text-[#A1887F] bg-[#EFEBE9] px-2 py-0.5 rounded-full">
                    Proximamente
                  </span>
                </div>
              ))}
            </div>

            {/* Simular recarga */}
            <button
              onClick={handleSimularRecarga}
              disabled={recargado}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all bg-[#8D6E63] text-white hover:bg-[#6D4C41] disabled:opacity-70"
            >
              {recargado
                ? `✓ Saldo agregado: +$${montoRecarga} MXN`
                : `Simular recarga de $${montoRecarga} MXN`}
            </button>

            <p className="text-xs text-center text-[#A1887F]">
              Tu saldo estara disponible en segundos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
