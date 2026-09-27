"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAccesly } from "accesly";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import FollowButton from "@/components/perfil/FollowButton";
import { getFollowingCount, getFollowerCount, isFollowing } from "@/lib/mockFollow";

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
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"publicaciones" | "resenas" | "guardados">("publicaciones");
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [cargando, setCargando] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const userEmail = session?.user?.email || wallet?.email;
  // Viewing someone else's profile via /perfil?usuario=<id>. Falls back to
  // the logged-in user's own profile when absent.
  const viewedUserId = searchParams.get("usuario");
  const isOwnProfile = !viewedUserId;

  const userInicial = perfil?.name?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "?";
  const username = perfil?.email?.split("@")[0] || "";
  const roleInfo = ROLE_LABELS[perfil?.role ?? "RIZADA"] ?? ROLE_LABELS.RIZADA;

  useEffect(() => {
    if (isOwnProfile && !userEmail) { setCargando(false); return; }

    const query = isOwnProfile
      ? `email=${encodeURIComponent(userEmail as string)}`
      : `id=${encodeURIComponent(viewedUserId as string)}`;

    fetch(`/api/user/me?${query}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.id) return;
        setPerfil(data);

        // Follow state and counters are derived from the profile just
        // loaded (mocked locally until #12's API lands — see lib/mockFollow.ts).
        setFollowerCount(getFollowerCount(data.id));
        setFollowingCount(
          isOwnProfile && userEmail
            ? getFollowingCount(userEmail)
            : getFollowingCount(data.email),
        );
        if (!isOwnProfile && userEmail) {
          setFollowing(isFollowing(userEmail, data.id));
        }
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [isOwnProfile, userEmail, viewedUserId]);

  if (isOwnProfile && !userEmail) {
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

  if (!isOwnProfile && !perfil) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-[#A1887F] text-sm">No se encontro este perfil</p>
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

        {/* Boton editar / seguir */}
        <div className="absolute bottom-4 right-4">
          {isOwnProfile ? (
            <button className="bg-white border border-[#D7CCC8] text-[#4E342E] px-4 py-2 rounded-full text-xs font-medium hover:bg-[#FAF8F5] transition-colors">
              Editar perfil
            </button>
          ) : (
            userEmail &&
            perfil && (
              <FollowButton
                viewerEmail={userEmail}
                targetUserId={perfil.id}
                initialFollowing={following}
                onChange={(next) => {
                  setFollowing(next);
                  setFollowerCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
                }}
              />
            )
          )}
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
          </div>
        </div>

        {/* Tokens */}
        {isOwnProfile && (
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
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 bg-white rounded-2xl border border-[#D7CCC8] p-5 mb-6">
        {[
          { label: "Publicaciones", valor: perfil?._count?.posts ?? 0 },
          { label: "Seguidores", valor: followerCount },
          { label: "Siguiendo", valor: followingCount },
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

    </div>
  );
}
