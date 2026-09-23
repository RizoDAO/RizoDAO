"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccesly } from "accesly";
import { signIn } from "next-auth/react";
import { migrateGuestProfile } from "@/lib/guestCurlProfile";

type Props = {
  onClose: () => void;
};

export default function AuthModal({ onClose }: Props) {
  const router = useRouter();
  const { connect } = useAccesly();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vista, setVista] = useState<"opciones" | "login">("opciones");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result?.ok || result?.error) {
        setError("Correo o contrasena incorrectos");
        return;
      }
      // Migrate any quiz results the user completed as a guest
      await migrateGuestProfile({ email });
      onClose();
      router.refresh();
      router.push("/comunidad");
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = () => {
    connect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div className="relative bg-white rounded-3xl p-8 w-full max-w-sm border border-[#D7CCC8] shadow-xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[#8D6E63]">o</span>
            <span className="text-lg font-bold text-[#3E2723]"
              style={{ fontFamily: "var(--font-playfair)" }}>RIZO</span>
          </div>
          <button onClick={onClose} className="text-[#A1887F] hover:text-[#3E2723] transition-colors text-lg">x</button>
        </div>

        {/* Vista opciones */}
        {vista === "opciones" && (
          <>
            <h2 className="text-xl font-bold text-[#3E2723] mb-1"
              style={{ fontFamily: "var(--font-playfair)" }}>
              Como quieres entrar?
            </h2>
            <p className="text-xs text-[#A1887F] mb-6">Elige tu metodo de acceso</p>

            <div className="flex flex-col gap-3">
              {/* Login con email */}
              <button onClick={() => setVista("login")}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#D7CCC8] hover:border-[#8D6E63] hover:bg-[#EFEBE9] transition-all text-left">
                <div className="w-10 h-10 rounded-xl bg-[#EFEBE9] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✉️</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#3E2723]">Iniciar sesion</p>
                  <p className="text-xs text-[#A1887F] mt-0.5">Con email y contrasena</p>
                </div>
              </button>

              {/* Connect Wallet */}
              <button onClick={handleConnectWallet}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#D7CCC8] hover:border-[#8D6E63] hover:bg-[#EFEBE9] transition-all text-left">
                <div className="w-10 h-10 rounded-xl bg-[#EEEDFE] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🔑</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#3E2723]">Connect Wallet</p>
                  <p className="text-xs text-[#A1887F] mt-0.5">Con tu wallet Stellar via Accesly</p>
                </div>
              </button>

              {/* Registro */}
              <div className="text-center pt-2">
                <p className="text-xs text-[#A1887F]">
                  No tienes cuenta?{" "}
                  <button onClick={() => { onClose(); router.push("/registro"); }}
                    className="text-[#8D6E63] font-medium hover:underline">
                    Registrate gratis
                  </button>
                </p>
              </div>
            </div>
          </>
        )}

        {/* Vista login */}
        {vista === "login" && (
          <>
            <button onClick={() => setVista("opciones")}
              className="text-xs text-[#A1887F] hover:text-[#8D6E63] transition-colors mb-4">
              Atras
            </button>
            <h2 className="text-xl font-bold text-[#3E2723] mb-6"
              style={{ fontFamily: "var(--font-playfair)" }}>
              Iniciar sesion
            </h2>

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
                  className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder-[#BCAAA4] focus:outline-none focus:border-[#8D6E63] transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6D4C41]">Contrasena</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="........"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full bg-[#FAF8F5] border border-[#D7CCC8] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder-[#BCAAA4] focus:outline-none focus:border-[#8D6E63] transition-colors" />
              </div>
              <button onClick={handleLogin} disabled={loading || !email || !password}
                className="w-full bg-[#8D6E63] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#6D4C41] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
