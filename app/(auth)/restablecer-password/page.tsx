"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RestablecerPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!token) {
      setError("El enlace no es valido. Solicita uno nuevo.");
      return;
    }
    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "El enlace es invalido o ha expirado");
        return;
      }

      setExito(true);
      setTimeout(() => router.push("/login"), 2500);
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
        <p className="text-sm text-[#8D6E63] mt-2">Elige una nueva contrasena</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#D7CCC8]">
        <h1 className="text-2xl font-bold text-[#3E2723] mb-6" style={{ fontFamily: "var(--font-playfair)" }}>
          Restablecer contrasena
        </h1>

        {exito ? (
          <p className="text-sm text-[#6D4C41]">
            Tu contrasena fue actualizada. Redirigiendo al inicio de sesion...
          </p>
        ) : (
          <>
            {!token && (
              <div className="bg-[#FBEAF2] border border-[#D7CCC8] rounded-xl px-4 py-3 text-xs text-[#993556] mb-4">
                Este enlace no incluye un token valido. Solicita uno nuevo desde{" "}
                <Link href="/olvide-password" className="underline">olvide mi contrasena</Link>.
              </div>
            )}

            {error && (
              <div className="bg-[#FBEAF2] border border-[#D7CCC8] rounded-xl px-4 py-3 text-xs text-[#993556] mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6D4C41]">Nueva contrasena</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 8 caracteres"
                  className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder-[#BCAAA4] focus:outline-none focus:border-[#8D6E63] transition-colors" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6D4C41]">Confirmar contrasena</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contrasena"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder-[#BCAAA4] focus:outline-none focus:border-[#8D6E63] transition-colors" />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-[#8D6E63] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#6D4C41] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2">
                {loading ? "Guardando..." : "Guardar nueva contrasena"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RestablecerPasswordPage() {
  return (
    <Suspense fallback={null}>
      <RestablecerPasswordForm />
    </Suspense>
  );
}
