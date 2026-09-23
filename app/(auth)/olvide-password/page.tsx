"use client";
import Link from "next/link";
import { useState } from "react";

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al procesar la solicitud");
        return;
      }

      setEnviado(true);
    } catch {
      setError("Error de conexion, intenta de nuevo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-[#8D6E63] text-xl">o</span>
          <span className="text-2xl font-bold text-[#3E2723]" style={{ fontFamily: "var(--font-playfair)" }}>RIZO</span>
        </Link>
        <p className="text-sm text-[#8D6E63] mt-2">Recupera el acceso a tu cuenta</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#D7CCC8]">
        <h1 className="text-2xl font-bold text-[#3E2723] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          Olvidaste tu contrasena?
        </h1>

        {enviado ? (
          <p className="text-sm text-[#6D4C41] mt-4">
            Si el correo <strong>{email}</strong> esta registrado, recibiras un enlace para
            restablecer tu contrasena en los proximos minutos. El enlace expira en 1 hora.
          </p>
        ) : (
          <>
            <p className="text-xs text-[#8D6E63] mb-6">
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </p>

            {error && (
              <div className="bg-[#FBEAF2] border border-[#D7CCC8] rounded-xl px-4 py-3 text-xs text-[#993556] mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6D4C41]">Correo electronico</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder-[#BCAAA4] focus:outline-none focus:border-[#8D6E63] transition-colors" />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !email}
                className="w-full bg-[#8D6E63] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#6D4C41] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2">
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs text-[#8D6E63] mt-6">
        <Link href="/login" className="text-[#8D6E63] font-medium hover:underline">
          Volver a iniciar sesion
        </Link>
      </p>
    </div>
  );
}
