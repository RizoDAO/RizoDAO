"use client";
import Link from "next/link";
import { useState } from "react";
import { useAccesly } from "accesly";
import AuthModal from "@/components/layout/AuthModal";
import { useSession, signOut } from "next-auth/react";

const linksBase = [
  { label: "Comunidad",    href: "/comunidad" },
  { label: "Tienda",       href: "/tienda" },
  { label: "Diagnóstico",  href: "/diagnostico" },
  { label: "Profesionales", href: "/estilistas" },
];

const linksAuth = [
  { label: "Mi perfil",    href: "/perfil" },
  { label: "Recompensas",  href: "/recompensas" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { wallet, disconnect } = useAccesly();
  const { data: session } = useSession();

  const estaLogueado = !!wallet || !!session?.user;
  const userInicial = wallet?.email?.[0]?.toUpperCase()
    || session?.user?.name?.[0]?.toUpperCase()
    || "U";

  const handleDesconectar = () => {
    setDropdownOpen(false);
    if (wallet) disconnect();
    if (session?.user) signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <nav className="w-full bg-[#FAF8F5] border-b border-[#D7CCC8] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[#8D6E63] text-lg">◎</span>
            <span className="text-xl font-bold text-[#3E2723] tracking-tight"
              style={{ fontFamily: "var(--font-playfair)" }}>
              RIZO
            </span>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-8">
            {linksBase.map((item) => (
              <Link key={item.label} href={item.href}
                className="text-sm text-[#4E342E] hover:text-[#8D6E63] transition-colors">
                {item.label}
              </Link>
            ))}
            {estaLogueado && linksAuth.map((item) => (
              <Link key={item.label} href={item.href}
                className="text-sm text-[#4E342E] hover:text-[#8D6E63] transition-colors">
                {item.label}
              </Link>
            ))}
          </div>

          {/* Derecha */}
          <div className="hidden md:flex items-center gap-3">
            {estaLogueado ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="w-8 h-8 rounded-full bg-[#8D6E63] flex items-center justify-center cursor-pointer">
                  <span className="text-xs font-bold text-white">{userInicial}</span>
                </button>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 top-10 bg-white border border-[#D7CCC8] rounded-xl shadow-md py-2 min-w-44 z-50">
                      <div className="px-4 py-2 border-b border-[#FAF8F5] mb-1">
                        <p className="text-xs font-semibold text-[#3E2723]">
                          {session?.user?.name || wallet?.email?.split("@")[0] || "Usuario"}
                        </p>
                        <p className="text-xs text-[#A1887F]">
                          {session?.user?.email || wallet?.email || ""}
                        </p>
                      </div>
                      <button onClick={handleDesconectar}
                        className="w-full text-left px-4 py-2 text-xs text-[#8D6E63] hover:bg-[#EFEBE9]">
                        Cerrar sesion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={() => setModalOpen(true)}
                className="text-sm bg-[#8D6E63] text-white px-5 py-2 rounded-full hover:bg-[#6D4C41] transition-colors">
                Entrar
              </button>
            )}
          </div>

          {/* Menú móvil — hamburguesa */}
          <button className="md:hidden text-[#4E342E]"
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Menú móvil desplegable */}
        {menuOpen && (
          <div className="md:hidden bg-[#FAF8F5] border-t border-[#D7CCC8] px-6 py-4 flex flex-col gap-4">
            {linksBase.map((item) => (
              <Link key={item.label} href={item.href}
                className="text-sm text-[#4E342E]"
                onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            {estaLogueado && linksAuth.map((item) => (
              <Link key={item.label} href={item.href}
                className="text-sm text-[#4E342E]"
                onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            {estaLogueado ? (
              <button onClick={handleDesconectar}
                className="text-sm text-[#8D6E63] text-left">
                Cerrar sesion
              </button>
            ) : (
              <button onClick={() => { setMenuOpen(false); setModalOpen(true); }}
                className="text-sm bg-[#8D6E63] text-white px-5 py-2 rounded-full text-center">
                Entrar
              </button>
            )}
          </div>
        )}
      </nav>

      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
