"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useAccesly } from "accesly";
import CreatePost from "@/components/feed/CreatePost";
import PostCard from "@/components/feed/PostCard";
import Sidebar from "@/components/feed/Sidebar";
import { getFollowingIds } from "@/lib/mockFollow";

type Post = {
  id: string;
  content: string;
  imageUrl?: string;
  likes: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    verified: boolean;
  };
};

function getRol(role: string): "rizada" | "marca" | "estilista" {
  if (role.toLowerCase() === "marca") return "marca";
  if (role.toLowerCase() === "estilista") return "estilista";
  return "rizada";
}

function formatTiempo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  const horas = Math.floor(mins / 60);
  const dias = Math.floor(horas / 24);
  if (dias > 0) return `hace ${dias} dia${dias > 1 ? "s" : ""}`;
  if (horas > 0) return `hace ${horas} hora${horas > 1 ? "s" : ""}`;
  if (mins > 0) return `hace ${mins} min`;
  return "ahora";
}

export default function ComunidadPage() {
  const { data: session } = useSession();
  const { wallet } = useAccesly();
  const userEmail = wallet?.email || session?.user?.email;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<"todos" | "siguiendo">("todos");
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const cargarPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error cargando posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPosts();
  }, [cargarPosts]);

  // Mocked locally until issue #12's follow API lands — see lib/mockFollow.ts.
  useEffect(() => {
    if (userEmail) setFollowingIds(getFollowingIds(userEmail));
  }, [userEmail, feedTab]);

  const postsVisibles = useMemo(() => {
    if (feedTab === "todos") return posts;
    return posts.filter((p) => followingIds.includes(p.user.id));
  }, [posts, feedTab, followingIds]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Feed principal */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-[#3E2723]"
            style={{ fontFamily: "var(--font-playfair)" }}>
            Comunidad
          </h1>
          <CreatePost onPostCreado={cargarPosts} />

          {/* Tabs: Todos / Siguiendo */}
          <div className="flex gap-1 bg-white rounded-2xl p-1 border border-[#D7CCC8]">
            {[
              { id: "todos", label: "Todos" },
              { id: "siguiendo", label: "Siguiendo" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFeedTab(t.id as typeof feedTab)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: feedTab === t.id ? "#8D6E63" : "transparent",
                  color: feedTab === t.id ? "white" : "#A1887F",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-5 border border-[#D7CCC8] animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#D7CCC8]"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-[#D7CCC8] rounded w-32 mb-2"></div>
                      <div className="h-2 bg-[#D7CCC8] rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-[#D7CCC8] rounded w-full mb-2"></div>
                  <div className="h-3 bg-[#D7CCC8] rounded w-3/4"></div>
                </div>
              ))}
            </div>
          )}

          {/* Estado vacío: feed general sin publicaciones */}
          {!loading && feedTab === "todos" && postsVisibles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-[#D7CCC8]">
              <span className="text-4xl mb-4">🌀</span>
              <p className="text-sm font-semibold text-[#3E2723]">No hay publicaciones aun</p>
              <p className="text-xs text-[#A1887F] mt-1">Se la primera en compartir algo</p>
            </div>
          )}

          {/* Estado vacío diseñado: pestaña Siguiendo sin seguidos, o sin posts de ellos */}
          {!loading && feedTab === "siguiendo" && postsVisibles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-[#D7CCC8]">
              <span className="text-4xl mb-4">🫶</span>
              <p className="text-sm font-semibold text-[#3E2723]">
                {followingIds.length === 0
                  ? "Aun no sigues a nadie"
                  : "Las personas que sigues no han publicado todavia"}
              </p>
              <p className="text-xs text-[#A1887F] mt-1">
                {followingIds.length === 0
                  ? "Sigue a otras usuarias para ver sus publicaciones aqui"
                  : "Vuelve mas tarde para ver sus novedades"}
              </p>
            </div>
          )}

          {!loading && postsVisibles.length > 0 && postsVisibles.map((post) => (
            <PostCard key={post.id} post={{
              id: post.id,
              userId: post.user.id,
              autor: post.user.name || "Usuario",
              handle: `@${post.user.email.split("@")[0]}`,
              avatar: post.user.name?.[0]?.toUpperCase() ?? "U",
              tiempo: formatTiempo(post.createdAt),
              contenido: post.content,
              likes: post.likes,
              comentarios: 0,
              tipo: getRol(post.user.role),
            }} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

      </div>
    </div>
  );
}
